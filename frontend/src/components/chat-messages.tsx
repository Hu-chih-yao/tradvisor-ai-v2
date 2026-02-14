"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import type { UIMessage } from "@/lib/types";
import { MessageBubble } from "./message-bubble";

interface ChatMessagesProps {
  messages: UIMessage[];
  onSuggestionClick?: (text: string) => void;
}

const SUGGESTIONS = [
  "Analyze NVDA — is it overvalued?",
  "Find 3 undervalued tech stocks",
  "Compare AAPL vs MSFT",
  "What is Tesla's fair value?",
];

export function ChatMessages({
  messages,
  onSuggestionClick,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ═══ Empty state ═══ */
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 min-h-full">
        <div className="mb-10 flex flex-col items-center gap-3 animate-fadeIn">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
            What would you like to research?
          </h2>
          <p className="max-w-sm text-sm text-center leading-relaxed text-neutral-500 dark:text-neutral-400">
            Ask about any stock — get DCF valuations, moat analysis, and investment insights.
          </p>
        </div>

        {/* Suggestion cards */}
        <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((text, i) => (
            <button
              key={text}
              onClick={() => onSuggestionClick?.(text)}
              className="group flex items-center gap-3 rounded-lg border border-neutral-200/60 bg-white px-4 py-3 text-left text-[13px] text-neutral-600 transition-all hover:bg-neutral-50 hover:text-neutral-800 hover:shadow-sm active:scale-[0.99] dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 animate-fadeInUp"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex-1 min-w-0 leading-snug truncate">{text}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:opacity-40 text-neutral-500" />
            </button>
          ))}
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
