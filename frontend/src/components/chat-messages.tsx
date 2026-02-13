"use client";

import { useEffect, useRef } from "react";
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Target,
} from "lucide-react";
import type { UIMessage } from "@/lib/types";
import { MessageBubble } from "./message-bubble";

interface ChatMessagesProps {
  messages: UIMessage[];
  onSuggestionClick?: (text: string) => void;
}

const SUGGESTIONS = [
  { text: "Analyze NVDA — is it overvalued?", icon: BarChart3, tag: "Valuation" },
  { text: "Find 3 undervalued tech stocks", icon: Target, tag: "Screening" },
  { text: "Compare AAPL vs MSFT", icon: PieChart, tag: "Comparison" },
  { text: "What is Tesla's fair value?", icon: TrendingUp, tag: "DCF" },
  { text: "Explain DCF valuation for beginners", icon: Activity, tag: "Learn" },
  { text: "Which S&P 500 sectors are cheapest?", icon: LineChart, tag: "Sectors" },
];

export function ChatMessages({
  messages,
  onSuggestionClick,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ═══ Empty state — institutional trading hero ═══ */
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 gradient-accent-subtle min-h-full">
        <div className="mb-14 flex flex-col items-center gap-7 animate-fadeIn">
          {/* Logo with sparkle badge */}
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 shadow-xl shadow-blue-500/20 ring-1 ring-blue-400/15 animate-float-gentle">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-blue-100/60 dark:bg-slate-800 dark:ring-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
            </div>
          </div>

          <div className="text-center">
            {/* Editorial label */}
            <p className="editorial-label mb-3">AI Equity Research</p>

            <h2 className="font-serif text-[2.5rem] font-semibold tracking-tight text-slate-800 dark:text-white leading-none">
              <span className="italic">Tradvisor</span>AI
            </h2>

            {/* Editorial divider */}
            <div className="editorial-divider mx-auto mt-5 w-14" />

            <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400 text-balance">
              Institutional-grade equity analysis powered by AI.
              <br />
              DCF valuations, moat analysis, and actionable insights — delivered in seconds.
            </p>
          </div>
        </div>

        {/* ─── Suggestion cards — trading grid ─── */}
        <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.text}
                onClick={() => onSuggestionClick?.(s.text)}
                className="group flex items-center gap-3 rounded-xl border border-slate-200/40 bg-white/60 backdrop-blur-sm px-4 py-3.5 text-left text-[13px] text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-200/60 hover:bg-white/80 hover:text-blue-700 hover:shadow-md hover:scale-[1.012] active:scale-[0.99] dark:border-slate-700/30 dark:bg-slate-800/30 dark:text-slate-300 dark:hover:border-blue-800/40 dark:hover:bg-slate-800/50 dark:hover:text-blue-400 animate-fadeInUp"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50/60 transition-colors group-hover:bg-blue-100/60 dark:bg-blue-900/15 dark:group-hover:bg-blue-900/25">
                  <Icon className="h-4 w-4 text-blue-400/80 transition-colors group-hover:text-blue-500 dark:text-blue-500/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="leading-snug block truncate">{s.text}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 text-blue-500" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══ Messages list ═══ */
  return (
    <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full p-4 md:p-6">
      <div className="space-y-5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
