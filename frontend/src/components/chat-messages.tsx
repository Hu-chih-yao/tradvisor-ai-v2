"use client";

import { useEffect, useRef } from "react";
import {
  ArrowRight,
  BarChart3,
  Target,
  PieChart,
  TrendingUp,
} from "lucide-react";
import type { UIMessage } from "@/lib/types";
import { MessageBubble } from "./message-bubble";

interface ChatMessagesProps {
  messages: UIMessage[];
  onSuggestionClick?: (text: string) => void;
}

const SUGGESTIONS = [
  { text: "Analyze NVDA — is it overvalued?", icon: BarChart3 },
  { text: "Find 3 undervalued tech stocks", icon: Target },
  { text: "Compare AAPL vs MSFT", icon: PieChart },
  { text: "What is Tesla's fair value?", icon: TrendingUp },
];

export function ChatMessages({
  messages,
  onSuggestionClick,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ═══ Empty state — clean chat landing ═══ */
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 min-h-full">
        <div className="mb-10 flex flex-col items-center gap-4 animate-fadeIn">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-white">
            What would you like to research?
          </h2>
          <p className="max-w-sm text-sm text-center leading-relaxed text-slate-500 dark:text-slate-400">
            Ask about any stock — get DCF valuations, moat analysis, and investment insights.
          </p>
        </div>

        {/* Suggestion cards */}
        <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.text}
                onClick={() => onSuggestionClick?.(s.text)}
                className="group flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/70 px-4 py-3 text-left text-[13px] text-slate-600 transition-all duration-200 hover:border-blue-200/60 hover:bg-white hover:text-blue-700 hover:shadow-sm active:scale-[0.99] dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-blue-800/40 dark:hover:bg-slate-800/60 dark:hover:text-blue-400 animate-fadeInUp"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Icon className="h-4 w-4 shrink-0 text-blue-400/70 group-hover:text-blue-500 dark:text-blue-500/50" />
                <span className="flex-1 min-w-0 leading-snug truncate">{s.text}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:opacity-60 text-blue-500" />
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
