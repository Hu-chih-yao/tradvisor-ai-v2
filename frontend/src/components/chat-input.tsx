"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  externalValue?: string;
  onExternalValueConsumed?: () => void;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  externalValue,
  onExternalValueConsumed,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle external value (suggestion clicks)
  useEffect(() => {
    if (externalValue) {
      setValue(externalValue);
      onExternalValueConsumed?.();
      setTimeout(() => {
        onSend(externalValue);
        setValue("");
      }, 100);
    }
  }, [externalValue, onExternalValueConsumed, onSend]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [value]);

  function handleSubmit() {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Glass card container — Atelier style */}
      <div className="glass-surface rounded-2xl p-3 md:p-4 flex items-end gap-3 shadow-lg transition-all duration-200 focus-within:shadow-xl">
        {/* Divider dot */}
        <span className="w-px h-5 bg-slate-200/40 dark:bg-slate-700/40 shrink-0 mb-1.5 hidden md:block"></span>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any stock..."
          rows={1}
          className="flex-1 min-w-0 resize-none bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400/70 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500/70 leading-relaxed font-medium tracking-wide"
        />

        {isLoading ? (
          <button
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50/80 text-red-500 transition-all duration-150 hover:bg-red-100 hover:scale-105 active:scale-95 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/35"
            title="Stop generation"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
              value.trim()
                ? "bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/15 hover:shadow-xl hover:scale-105 active:scale-95"
                : "bg-slate-100/60 text-slate-400 dark:bg-slate-700/40 dark:text-slate-500"
            )}
            title="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-2.5 text-center text-[10px] text-slate-400/50 tracking-wider dark:text-slate-500/40 font-medium uppercase">
        TradvisorAI provides analysis, not financial advice
      </p>
    </div>
  );
}
