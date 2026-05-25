"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Globe,
  Terminal,
  CheckCircle2,
  Loader2,
  Code2,
  Palette,
  Package,
  Sparkles as SparklesIcon,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CopyCommand } from "@/components/landing/copy-command";
import { BrandLogo, type BrandSlug } from "@/components/landing/brand-logo";
import { WaitlistForm } from "@/components/landing/waitlist-form";

type Status = "idle" | "analyzing" | "scraping" | "building" | "ready";

const MIGRATION_SOURCES: BrandSlug[] = ["shopify", "woocommerce", "magento", "squarespace"];

const MOCK_LOGS = [
  "Initializing Agentic Workforce...",
  "Connecting to source URL...",
  "Analyzing DOM structure and styling...",
  "Extracting brand palette: Primary (#171717), Secondary (#D97757)",
  "Mapping product catalog...",
  "Found 128 products. Starting import and translation via Gemini...",
  "Generating GEO (Generative Engine Optimization) descriptions...",
  "Deploying Vibe Template 'Midnight SaaS'...",
  "Setting up ACP (Agentic Commerce Protocol) endpoints...",
  "Infrastructure ready.",
];

const AGENTS = [
  {
    icon: Code2,
    title: "DOM Analyzer",
    body: "Reads the source site's HTML and CSS to understand structure, navigation, and brand palette.",
  },
  {
    icon: Palette,
    title: "Brand Extractor",
    body: "Identifies primary + secondary colors, fonts, and tone of voice. Writes the new brand.config.ts.",
  },
  {
    icon: Package,
    title: "Product Mapper",
    body: "Pulls every product, variant, image, and category. Normalises into Cartwright's Prisma schema.",
  },
  {
    icon: SparklesIcon,
    title: "SEO Generator",
    body: "Drafts Generative-Engine-Optimised product descriptions via Gemini in your active locales.",
  },
  {
    icon: Rocket,
    title: "ACP Deployer",
    body: "Provisions /api/acp/* endpoints, signs the Agent Card, and pushes the build to Vercel.",
  },
];

export default function AgenticOnboarding() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<string[]>([]);

  const startOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setStatus("analyzing");
    setLogs([]);
  };

  useEffect(() => {
    if (status !== "idle" && status !== "ready") {
      let currentLogIndex = 0;
      const logInterval = setInterval(() => {
        if (currentLogIndex < MOCK_LOGS.length) {
          setLogs((prev) => [...prev, MOCK_LOGS[currentLogIndex]]);
          if (currentLogIndex === 3) setStatus("scraping");
          if (currentLogIndex === 6) setStatus("building");
          currentLogIndex++;
        } else {
          clearInterval(logInterval);
          setTimeout(() => setStatus("ready"), 1000);
        }
      }, 800);

      return () => clearInterval(logInterval);
    }
  }, [status]);

  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      <div aria-hidden className="absolute inset-0 cw-grid-bg opacity-50" />

      <div className="relative mx-auto max-w-6xl px-6 pt-24 sm:pt-32">
        <AnimatePresence mode="wait">
          {/* Phase 1: Idle (hero + URL input) */}
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              {/* Hero */}
              <div className="flex flex-col items-center text-center">
                <Badge tone="terracotta" className="mb-6">
                  <span className="size-1.5 rounded-full bg-cw-terracotta" />
                  Plus tier preview
                </Badge>
                <h1 className="max-w-3xl text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                  Type a URL.{" "}
                  <span className="relative inline-block text-cw-terracotta">
                    <span className="relative z-10">Get a shop.</span>
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-1 h-3 bg-cw-terracotta/20 dark:bg-cw-terracotta/30 -z-0"
                    />
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400">
                  Paste your current Shopify or WooCommerce URL. A five-agent
                  AI workforce extracts your brand, products, and content — then
                  deploys a Cartwright shop on Vercel. Launching Q3 2026 with{" "}
                  <Link
                    href="/pricing"
                    className="font-medium text-cw-terracotta hover:underline"
                  >
                    Plus
                  </Link>
                  .
                </p>
              </div>

              {/* Migration source strip */}
              <div className="mt-10 mx-auto max-w-xl rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/40 dark:bg-cw-stone-900/40 px-6 py-5">
                <p className="text-center text-xs font-mono uppercase tracking-[0.16em] text-cw-stone-500 dark:text-cw-stone-400 mb-4">
                  Migrate from
                </p>
                <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
                  {MIGRATION_SOURCES.map((slug) => (
                    <li key={slug}>
                      <BrandLogo brand={slug} size={32} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* URL input */}
              <form
                onSubmit={startOnboarding}
                className="mt-10 mx-auto max-w-xl flex items-stretch gap-2"
              >
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-cw-stone-400" />
                  <input
                    type="url"
                    placeholder="https://your-old-shop.com"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-14 w-full rounded-md border border-cw-stone-300 dark:border-cw-stone-700 bg-cw-paper dark:bg-cw-stone-900 pl-12 pr-4 text-base text-cw-stone-900 dark:text-cw-stone-50 placeholder:text-cw-stone-400 focus:outline-none focus:ring-2 focus:ring-cw-terracotta focus:border-cw-terracotta"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 h-14 px-6 rounded-md font-medium bg-cw-terracotta text-cw-ink hover:bg-cw-terracotta-strong hover:text-white transition-colors shadow-sm"
                >
                  Try the demo
                  <ArrowRight className="size-5" />
                </button>
              </form>
              <p className="mt-4 text-center text-xs text-cw-stone-500 dark:text-cw-stone-400">
                Demo only — the migration agent ships with Plus in Q3 2026.
              </p>
            </motion.div>
          )}

          {/* Phase 2: Processing (Terminal) */}
          {(status === "analyzing" || status === "scraping" || status === "building") && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-2xl mb-10 mx-auto text-center">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
                  Live demo
                </p>
                <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                  {status === "analyzing" && "Analyzing your platform."}
                  {status === "scraping" && "Extracting product catalog."}
                  {status === "building" && "Generating your Cartwright shop."}
                </h2>
                <p className="mt-4 inline-flex items-center justify-center gap-2 text-sm text-cw-stone-500 dark:text-cw-stone-400">
                  <Loader2 className="size-4 animate-spin" />
                  Five AI agents are working on it. Do not close this window.
                </p>
              </div>

              <div className="mx-auto max-w-3xl rounded-2xl overflow-hidden border border-cw-stone-800 bg-cw-code-bg shadow-2xl">
                <div className="border-b border-cw-stone-800 px-5 py-3 flex items-center gap-4 bg-cw-stone-900/60">
                  <div className="flex gap-2">
                    <div className="size-3 rounded-full bg-red-500/80" />
                    <div className="size-3 rounded-full bg-yellow-500/80" />
                    <div className="size-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs font-mono text-cw-stone-400 flex items-center gap-2">
                    <Terminal className="size-3.5" />
                    migration-agent_v3.sh
                  </div>
                </div>

                <div className="p-6 font-mono text-sm sm:text-base h-[320px] overflow-y-auto space-y-2.5">
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-cw-stone-200"
                    >
                      <span className="text-cw-terracotta mr-3">➜</span>
                      {log}
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2.5 h-5 bg-cw-stone-400 inline-block align-middle ml-2"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 3: Ready */}
          {status === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="max-w-2xl mx-auto text-center">
                <div className="mx-auto mb-8 size-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-10" />
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
                  Migration complete
                </p>
                <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                  Your Cartwright shop is ready.
                </h2>
                <p className="mt-4 text-base text-cw-stone-500 dark:text-cw-stone-400">
                  Brand extracted, products imported, ACP endpoints signed.
                  In production, the build would be live behind your custom
                  domain right now.
                </p>
              </div>

              <div className="mt-10 mx-auto max-w-2xl rounded-3xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 backdrop-blur-sm p-8 space-y-5">
                <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-cw-stone-500 dark:text-cw-stone-400 pb-4 border-b border-cw-stone-200 dark:border-cw-stone-800">
                  Migration summary
                </h3>
                <div className="flex justify-between items-center text-sm text-cw-stone-600 dark:text-cw-stone-300">
                  <span>Products imported</span>
                  <span className="font-mono text-cw-stone-900 dark:text-cw-stone-50">128</span>
                </div>
                <div className="flex justify-between items-center text-sm text-cw-stone-600 dark:text-cw-stone-300">
                  <span>AI-generated GEO descriptions</span>
                  <span className="font-mono text-cw-stone-900 dark:text-cw-stone-50">128</span>
                </div>
                <div className="flex justify-between items-center text-sm text-cw-stone-600 dark:text-cw-stone-300">
                  <span>Brand palette</span>
                  <div className="flex gap-2">
                    <div className="size-5 rounded-md bg-[#171717] border border-cw-stone-200 dark:border-cw-stone-700" />
                    <div className="size-5 rounded-md bg-[#D97757] border border-cw-stone-200 dark:border-cw-stone-700" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm pt-4 border-t border-cw-stone-200 dark:border-cw-stone-800">
                  <span className="text-cw-stone-600 dark:text-cw-stone-300">ACP endpoints</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="size-4" /> Signed &amp; live
                  </span>
                </div>
              </div>

              {/* Plus waitlist embed — primary CTA */}
              <div className="mt-10 mx-auto max-w-xl">
                <p className="text-center text-sm text-cw-stone-500 dark:text-cw-stone-400 mb-3">
                  Be first in line when the migration agent goes live.
                </p>
                <WaitlistForm tier="plus" ctaLabel="Join Plus waitlist" />
              </div>

              <p className="mt-6 text-center text-xs text-cw-stone-500 dark:text-cw-stone-400">
                Want a free self-hosted shop today?{" "}
                <Link
                  href="/docs/getting-started/quick-start"
                  className="font-medium text-cw-terracotta hover:underline"
                >
                  Scaffold one with the CLI →
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* "Behind the scenes" — persistent across all phases */}
        <div className="mt-24 sm:mt-32">
          <div className="max-w-2xl mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              The five agents
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              AI does the boring parts.
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              The terminal above shows five agents handing off in sequence.
              Each one owns a single phase of the migration, and each one is a
              specialised AI workflow rather than a generic chat model.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {AGENTS.map((agent) => (
              <div
                key={agent.title}
                className="flex flex-col rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/40 dark:bg-cw-stone-900/40 p-5"
              >
                <div className="size-9 rounded-lg bg-cw-terracotta/10 text-cw-terracotta flex items-center justify-center mb-4">
                  <agent.icon className="size-5" />
                </div>
                <h3 className="text-sm font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                  {agent.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
                  {agent.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA footer */}
        <div className="mt-24 sm:mt-32 flex flex-col items-center text-center">
          <h2 className="max-w-2xl text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Start self-hosted. Layer on Plus when it lands.
          </h2>
          <p className="mt-4 max-w-xl text-base text-cw-stone-500 dark:text-cw-stone-400">
            The CLI scaffolds a free MIT shop today. Agentic onboarding ships
            with the Plus tier in Q3 2026.
          </p>
          <div className="mt-8 w-full max-w-xl">
            <CopyCommand command="npx create-cartwright@latest my-shop" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <ButtonLink href="/pricing" size="lg">
              See pricing
            </ButtonLink>
            <ButtonLink href="/integrations" variant="outline" size="lg">
              See integrations
            </ButtonLink>
          </div>
        </div>
      </div>
    </main>
  );
}
