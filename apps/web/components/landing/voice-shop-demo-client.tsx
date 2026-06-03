"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Voice-shop demo — INTERACTIVE client component.
 *
 * Renderes kun når parent (voice-shop-demo.tsx server component) har
 * verificeret VOICE_DEMO_ENABLED + GOOGLE_GENAI_API_KEY env-vars.
 *
 * Klik → mints anonymous ephemeral token mod Cartwright's egen Gemini-key,
 * 30s session, audio-out only (no vision), hardcoded demo-catalog via
 * /api/voice-demo/tool-dispatch.
 */

const PCM_WORKLET_SOURCE = `
class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor(opts) {
    super();
    this.targetRate = opts.processorOptions.targetRate;
    this.sourceRate = sampleRate;
    this.ratio = this.sourceRate / this.targetRate;
    this.acc = 0;
    this.buffer = [];
    this.FRAME_SIZE = 1600;
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const channel = input[0];
    for (let i = 0; i < channel.length; i++) {
      this.acc += 1;
      if (this.acc >= this.ratio) {
        this.acc -= this.ratio;
        this.buffer.push(channel[i]);
        if (this.buffer.length >= this.FRAME_SIZE) {
          const out = new Float32Array(this.buffer);
          this.buffer = [];
          this.port.postMessage(out, [out.buffer]);
        }
      }
    }
    return true;
  }
}
registerProcessor('pcm-capture', PCMCaptureProcessor);
`;

type DemoState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "ended"
  | "error";

type DemoCard = { id: string; name: string; description: string };

export function VoiceShopDemoClient() {
  const [state, setState] = useState<DemoState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [cards, setCards] = useState<DemoCard[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const sessionRef = useRef<{
    audioCtx: AudioContext | null;
    worklet: AudioWorkletNode | null;
    media: MediaStream | null;
    session: Awaited<ReturnType<GoogleGenAI["live"]["connect"]>> | null;
    playbackCursor: number;
    sessionId: string | null;
  }>({
    audioCtx: null,
    worklet: null,
    media: null,
    session: null,
    playbackCursor: 0,
    sessionId: null,
  });

  async function startDemo() {
    setError(null);
    setTranscript("");
    setCards([]);
    setSecondsLeft(30);
    setState("connecting");

    try {
      const tokenRes = await fetch("/api/voice-demo/token", { method: "POST" });
      if (!tokenRes.ok) {
        const body = (await tokenRes.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Couldn't start the demo.");
        setState("error");
        return;
      }
      const { token, sessionId, model } = (await tokenRes.json()) as {
        token: string;
        sessionId: string;
        model: string;
      };
      sessionRef.current.sessionId = sessionId;

      const media = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 48000, echoCancellation: true },
      });
      sessionRef.current.media = media;

      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new Ctor({ sampleRate: 24000 });
      sessionRef.current.audioCtx = audioCtx;

      const workletUrl = URL.createObjectURL(
        new Blob([PCM_WORKLET_SOURCE], { type: "application/javascript" }),
      );
      await audioCtx.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: "v1alpha" },
      });

      const session = await ai.live.connect({
        model,
        config: { responseModalities: [Modality.AUDIO] },
        callbacks: {
          onopen: () => setState("listening"),
          onmessage: (msg: unknown) => handleMessage(msg, audioCtx),
          onerror: () => {
            setError("Lost connection to the demo voice.");
            setState("error");
          },
          onclose: () => {
            setState((prev) => (prev !== "ended" ? "ended" : prev));
          },
        },
      });
      sessionRef.current.session = session;

      const source = audioCtx.createMediaStreamSource(media);
      const worklet = new AudioWorkletNode(audioCtx, "pcm-capture", {
        processorOptions: { targetRate: 16000 },
      });
      worklet.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (!sessionRef.current.session) return;
        const int16 = float32ToInt16(e.data);
        const base64 = base64FromBuffer(int16.buffer as ArrayBuffer);
        sessionRef.current.session.sendRealtimeInput({
          audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
        });
      };
      source.connect(worklet);
      sessionRef.current.worklet = worklet;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed.");
      setState("error");
    }
  }

  function handleMessage(msg: unknown, audioCtx: AudioContext) {
    const m = msg as {
      serverContent?: {
        modelTurn?: {
          parts?: Array<{
            inlineData?: { data: string; mimeType: string };
            text?: string;
          }>;
        };
        turnComplete?: boolean;
      };
      toolCall?: {
        functionCalls: Array<{
          id: string;
          name: string;
          args: Record<string, unknown>;
        }>;
      };
    };

    if (m.toolCall) {
      setState("thinking");
      for (const call of m.toolCall.functionCalls) {
        void dispatchTool(call);
      }
      return;
    }

    if (m.serverContent) {
      const parts = m.serverContent.modelTurn?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.mimeType.startsWith("audio")) {
          setState("speaking");
          playAudio(part.inlineData.data, audioCtx);
        }
        if (part.text) {
          setTranscript((prev) => prev + part.text);
        }
      }
      if (m.serverContent.turnComplete) {
        setState("listening");
      }
    }
  }

  async function dispatchTool(call: {
    id: string;
    name: string;
    args: Record<string, unknown>;
  }) {
    const session = sessionRef.current.session;
    if (!session) return;
    try {
      const res = await fetch("/api/voice-demo/tool-dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionRef.current.sessionId,
          toolCallId: call.id,
          toolName: call.name,
          args: call.args,
        }),
      });
      const body = (await res.json()) as {
        kind: "result";
        functionResponses: Array<{
          id: string;
          name: string;
          response: { result: unknown };
        }>;
      };
      session.sendToolResponse({ functionResponses: body.functionResponses });
      const first = body.functionResponses[0];
      if (first && Array.isArray(first.response.result)) {
        setCards(
          (first.response.result as DemoCard[]).slice(0, 3).map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
          })),
        );
      }
    } catch {
      // Demo-quality error handling — silent
    }
  }

  function playAudio(base64: string, audioCtx: AudioContext) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    const buffer = audioCtx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(audioCtx.destination);
    const startAt = Math.max(audioCtx.currentTime, sessionRef.current.playbackCursor);
    src.start(startAt);
    sessionRef.current.playbackCursor = startAt + buffer.duration;
  }

  function stopDemo() {
    const r = sessionRef.current;
    try {
      r.worklet?.disconnect();
    } catch {}
    try {
      r.session?.close();
    } catch {}
    r.media?.getTracks().forEach((t) => t.stop());
    if (r.audioCtx && r.audioCtx.state !== "closed") {
      void r.audioCtx.close();
    }
    sessionRef.current = {
      audioCtx: null,
      worklet: null,
      media: null,
      session: null,
      playbackCursor: 0,
      sessionId: null,
    };
    setState((prev) => (prev === "error" ? prev : "ended"));
  }

  // Countdown — inside-the-interval setState pattern to avoid set-state-in-effect lint
  useEffect(() => {
    if (state !== "listening" && state !== "speaking" && state !== "thinking")
      return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        const next = Math.max(0, s - 1);
        if (next === 0 && s > 0) {
          stopDemo();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDemo();
    };
  }, []);

  const active =
    state === "listening" || state === "thinking" || state === "speaking";

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      {!active && state !== "ended" && (
        <button
          type="button"
          onClick={startDemo}
          disabled={state === "connecting"}
          className="group flex h-20 w-20 items-center justify-center rounded-full bg-cw-terracotta text-white shadow-lg shadow-cw-terracotta/30 transition hover:scale-105 hover:bg-cw-terracotta-strong disabled:opacity-50"
          aria-label="Start voice demo"
        >
          <MicIcon className="h-8 w-8" />
        </button>
      )}

      {active && (
        <div className="flex flex-col items-center gap-2">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-cw-terracotta text-white">
            <span className="absolute inset-0 animate-ping rounded-full bg-cw-terracotta/50" />
            <MicIcon className="relative h-8 w-8" />
          </div>
          <span className="font-mono text-xs text-cw-stone-500">
            {state} · {secondsLeft}s left
          </span>
        </div>
      )}

      {state === "connecting" && (
        <p className="text-sm text-cw-stone-500">Connecting…</p>
      )}

      {state === "ended" && (
        <div className="text-center">
          <p className="text-sm text-cw-stone-600 dark:text-cw-stone-300">
            That&apos;s the demo. To run this on your own shop:
          </p>
          <code className="mt-3 inline-block rounded-md bg-cw-stone-900 px-4 py-2 font-mono text-xs text-cw-stone-50">
            npx create-cartwright@latest
          </code>
          <button
            type="button"
            onClick={startDemo}
            className="ml-2 text-xs font-semibold text-cw-terracotta underline"
          >
            Try again
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-cw-stone-300 bg-white px-3 py-2 text-sm text-cw-stone-700 dark:border-cw-stone-700 dark:bg-cw-stone-900 dark:text-cw-stone-200">
          {error}
        </p>
      )}

      {transcript && (
        <p className="mt-6 max-w-xl rounded-lg bg-white px-4 py-3 text-left text-sm italic text-cw-stone-700 shadow-sm dark:bg-cw-stone-900 dark:text-cw-stone-200">
          &ldquo;{transcript}&rdquo;
        </p>
      )}

      {cards.length > 0 && (
        <ul className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-cw-stone-200 bg-white p-4 text-left text-sm shadow-sm dark:border-cw-stone-800 dark:bg-cw-stone-900"
            >
              <div className="font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                {c.name}
              </div>
              <p className="mt-1 text-xs text-cw-stone-500 dark:text-cw-stone-400">
                {c.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function float32ToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    out[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return out;
}

function base64FromBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
