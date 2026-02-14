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
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-3 md:p-4 flex items-end gap-3 shadow-sm transition-all focus-within:shadow-md focus-within:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any stock..."
          rows={1}
          className="flex-1 min-w-0 resize-none bg-transparent text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500 leading-relaxed"
        />

        {isLoading ? (
          <button
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 active:scale-95 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600"
            title="Stop generation"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all",
              value.trim()
                ? "bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                : "bg-neutral-100 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500"
            )}
            title="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-2.5 text-center text-[10px] text-neutral-400/60 tracking-wider dark:text-neutral-500/50 font-medium uppercase">
        TradvisorAI provides analysis, not financial advice
      </p>
    </div>
  );
}
