"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Globe, Terminal, Sparkles, CheckCircle2, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

type Status = "idle" | "analyzing" | "scraping" | "building" | "ready";

export default function AgenticOnboarding() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  
  const mockLogs = [
    "Initializing Agentic Workforce...",
    "Connecting to source URL...",
    "Analyzing DOM structure and styling...",
    "Extracting brand palette: Primary (#171717), Secondary (#D97757)",
    "Mapping product catalog...",
    "Found 128 products. Starting import and translation via Gemini...",
    "Generating GEO (Generative Engine Optimization) descriptions...",
    "Deploying Vibe Template 'Midnight SaaS'...",
    "Setting up ACP (Agentic Commerce Protocol) endpoints...",
    "Infrastructure ready."
  ];

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
        if (currentLogIndex < mockLogs.length) {
          setLogs((prev) => [...prev, mockLogs[currentLogIndex]]);
          
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
    <HomeLayout {...baseOptions()}>
      <div className="min-h-screen bg-cw-paper dark:bg-cw-ink text-cw-stone-900 dark:text-cw-stone-50 font-sans selection:bg-cw-terracotta/30 pt-24 pb-12 overflow-hidden flex items-center relative">
        {/* Background Effect */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cw-terracotta/10 blur-[120px] rounded-full" />
        </div>

        <div className="container mx-auto max-w-4xl px-4 relative z-10">
          <AnimatePresence mode="wait">
            
            {/* Phase 1: Idle (Input) */}
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cw-terracotta/10 border border-cw-terracotta/20 text-cw-terracotta text-xs font-bold uppercase tracking-widest mb-8">
                  <Sparkles className="w-4 h-4" /> No-Code Agentic Onboarding
                </div>
                
                <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-6 leading-tight">
                  Let AI build your shop.<br />
                  <span className="text-cw-stone-400 dark:text-cw-stone-600">In under 2 minutes.</span>
                </h1>
                
                <p className="text-xl text-cw-stone-600 dark:text-cw-stone-400 mb-12 max-w-2xl mx-auto font-light">
                  Enter the URL to your current Shopify or WooCommerce store. Our Agentic Workforce automatically extracts your brand, products, and content, deploying a Next.js 16 Edge platform for you.
                </p>

                <form onSubmit={startOnboarding} className="max-w-xl mx-auto relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cw-terracotta to-cw-oker rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                  <div className="relative bg-white dark:bg-[#111] border border-cw-stone-200 dark:border-white/10 rounded-2xl p-2 flex items-center shadow-lg">
                    <div className="pl-4 text-cw-stone-400">
                      <Globe className="w-6 h-6" />
                    </div>
                    <input
                      type="url"
                      placeholder="https://your-old-shop.com"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 bg-transparent border-none text-cw-stone-900 dark:text-white px-4 py-4 focus:outline-none placeholder:text-cw-stone-400 text-lg"
                    />
                    <button 
                      type="submit"
                      className="bg-cw-stone-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                    >
                      Start AI <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
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
                className="max-w-3xl mx-auto"
              >
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black mb-4 text-cw-stone-900 dark:text-cw-stone-50">
                    {status === "analyzing" && "Analyzing your old platform..."}
                    {status === "scraping" && "Extracting product catalog..."}
                    {status === "building" && "Generating Vibe Template..."}
                  </h2>
                  <div className="flex items-center justify-center gap-3 text-cw-stone-600 dark:text-cw-stone-400">
                    <Loader2 className="w-5 h-5 animate-spin" /> Our 5 AI agents are working on it. Do not close this window.
                  </div>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center gap-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="text-xs font-mono text-white/40 flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> migration-agent_v3.sh
                    </div>
                  </div>
                  
                  <div className="p-6 font-mono text-sm sm:text-base h-[300px] overflow-y-auto space-y-3">
                    {logs.map((log, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-white/70"
                      >
                        <span className="text-cw-terracotta mr-3">➜</span>
                        {log}
                      </motion.div>
                    ))}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-3 h-5 bg-white/50 inline-block align-middle ml-2"
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
                className="text-center max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                
                <h1 className="text-5xl font-black tracking-tighter mb-6 text-cw-stone-900 dark:text-cw-stone-50">
                  Your Agentic Platform is ready!
                </h1>
                
                <p className="text-xl text-cw-stone-600 dark:text-cw-stone-400 mb-12 font-light">
                  We have migrated your data, optimized your SEO via AI, and inserted the products into Cartwright's The Golden Stack 2026 architecture.
                </p>

                <div className="bg-white dark:bg-[#111] border border-cw-stone-200 dark:border-white/10 rounded-3xl p-8 mb-12 text-left space-y-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 border-b border-cw-stone-200 dark:border-white/10 pb-4 text-cw-stone-900 dark:text-white">Migration Summary</h3>
                  <div className="flex justify-between items-center text-cw-stone-600 dark:text-white/70">
                    <span>Products Imported:</span>
                    <span className="font-mono text-cw-stone-900 dark:text-white">128</span>
                  </div>
                  <div className="flex justify-between items-center text-cw-stone-600 dark:text-white/70">
                    <span>Generated AI SEO descriptions:</span>
                    <span className="font-mono text-cw-stone-900 dark:text-white">128</span>
                  </div>
                  <div className="flex justify-between items-center text-cw-stone-600 dark:text-white/70">
                    <span>Brand Palette:</span>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#171717] border border-cw-stone-200 dark:border-white/20" />
                      <div className="w-6 h-6 rounded-md bg-[#D97757] border border-cw-stone-200 dark:border-white/20" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-cw-stone-600 dark:text-white/70 border-t border-cw-stone-200 dark:border-white/10 pt-4">
                    <span>Prepared ACP Endpoints:</span>
                    <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="#" 
                    className="px-8 py-4 rounded-xl font-bold bg-cw-stone-100 dark:bg-white/10 hover:bg-cw-stone-200 dark:hover:bg-white/20 text-cw-stone-900 dark:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" /> Preview in Sandbox
                  </Link>
                  <Link 
                    href="https://buy.stripe.com/test" 
                    className="px-8 py-4 rounded-xl font-bold bg-cw-terracotta hover:bg-cw-terracotta-strong text-white transition-all shadow-lg shadow-cw-terracotta/25 flex items-center justify-center gap-2"
                  >
                    Subscribe & Go Live ($49/mo) <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </HomeLayout>
  );
}
