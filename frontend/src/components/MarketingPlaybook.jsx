import React, { useEffect, useRef, useState } from "react";
import { BookOpen, Copy, Check, Sparkles, Send } from "lucide-react";

const BUILTIN_PLAYBOOK_TEMPLATES = [
  {
    id: "p-1",
    category: "Architecture Audit",
    title: "Database Query Latency Optimization",
    channel: "LinkedIn / Twitter",
    copy: "🚀 Optimization update: Reduced lookup latencies from 800ms down to 12ms.\n\nWhile auditing transaction logs in Supabase Postgres, composite queries were starting to drift. Added targeted indexes on lookup columns. Keep your infrastructure lean!\n\n#buildinpublic #backend #postgres",
    hashtags: ["buildinpublic", "backend", "postgres"]
  },
  {
    id: "p-2",
    category: "Trading Quant Spec",
    title: "Stateful Order Block Backtest Results",
    channel: "Twitter / Telegram",
    copy: "ETH/USDT Perp contract backtest completed (60-day period).\n\nKey metrics:\n- Profit Factor: 1.25\n- Win Rate: 58.4%\n- Max Drawdown: 4.2%\n\nExecuting logic local-first to control latency noise. No financial advice.",
    hashtags: ["algotrading", "quants", "bybit"]
  },
  {
    id: "p-3",
    category: "Feature Launch",
    title: "AI Multi-Channel Broadcast Center",
    channel: "Facebook Page / Instagram",
    copy: "Draft once with Gemini AI, adapt for every social channel, and publish automatically. Built 100% free for solo creators and developers. Try the live suite now! ⚡✨",
    hashtags: ["aismarter", "socialmedia", "tech"]
  }
];

export default function MarketingPlaybook() {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseInComposer = (copy) => {
    localStorage.setItem("glitch_composer_draft", copy);
    window.dispatchEvent(new CustomEvent('nav-change', { detail: 'composer' }));
  };

  return (
    <div className="flex-1 min-h-screen bg-[#121215] p-4 md:p-8 relative pb-32">
      {/* Background glow */}
      <div className="glow-blob w-[500px] h-[500px] bg-accent/10 top-0 left-1/4 opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
            <BookOpen size={14} /> Marketing Library
          </div>
          <h1 className="font-display text-3xl font-bold text-white mt-1">
            Marketing Playbook & High-Converting Templates
          </h1>
          <p className="text-xs text-muted mt-1 font-medium">
            Copy and paste proven high-converting developer & trader copy templates directly into Composer.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {BUILTIN_PLAYBOOK_TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-surface rounded-[28px] p-6 border border-white/5 hover:border-white/10 transition-all shadow-xl flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20 font-bold">
                  {tmpl.category}
                </span>
                <span className="text-[10px] font-mono text-muted">{tmpl.channel}</span>
              </div>

              <h3 className="font-bold text-white text-base tracking-tight">{tmpl.title}</h3>

              <div className="bg-[#121215] p-4 rounded-2xl border border-white/5 text-xs text-white leading-relaxed font-mono whitespace-pre-line shadow-inner">
                {tmpl.copy}
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(tmpl.id, tmpl.copy)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/5"
              >
                {copiedId === tmpl.id ? <Check size={14} className="text-signal" /> : <Copy size={14} />}
                <span>{copiedId === tmpl.id ? "Copied!" : "Copy Template"}</span>
              </button>

              <button
                onClick={() => handleUseInComposer(tmpl.copy)}
                className="flex-1 py-2.5 bg-accent text-[#121215] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <Send size={14} /> Send to Composer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
