"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Activity, User, Loader2 } from "lucide-react";
import type { UIMessage } from "@/lib/types";
import { PlanProgress } from "./plan-progress";
import { ToolIndicator } from "./tool-indicator";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: UIMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fadeIn",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700/50 mt-0.5">
          <Activity className="h-4 w-4" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "max-w-[85%] md:max-w-[82%] space-y-2.5 min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* User message */}
        {isUser && (
          <div className="rounded-2xl rounded-tr-md bg-neutral-800 px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-sm dark:bg-neutral-200 dark:text-neutral-900 break-words overflow-wrap-anywhere">
            {message.content}
          </div>
        )}

        {/* Assistant message */}
        {!isUser && (
          <div className="space-y-2.5">
            {/* Plan progress */}
            {message.plan && <PlanProgress plan={message.plan} />}

            {/* Tool activity */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <ToolIndicator toolCalls={message.toolCalls} />
            )}

            {/* Thinking / loading state */}
            {message.isStreaming && !message.content && !message.plan && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200/60 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 dark:text-neutral-500">
                    Analyzing...
                  </span>
                </div>
              </div>
            )}

            {/* Markdown content */}
            {message.content && (
              <div className="prose prose-sm prose-neutral max-w-none dark:prose-invert prose-headings:tracking-tight prose-headings:font-semibold prose-headings:text-neutral-800 dark:prose-headings:text-neutral-100 prose-p:text-neutral-600 prose-p:leading-relaxed prose-p:text-[14px] prose-p:break-words dark:prose-p:text-neutral-300 prose-strong:text-neutral-800 dark:prose-strong:text-neutral-100 prose-code:text-neutral-700 prose-code:font-medium prose-code:text-[13px] prose-code:break-words dark:prose-code:text-neutral-300 prose-a:text-neutral-700 prose-a:underline prose-a:underline-offset-2 prose-a:break-all hover:prose-a:text-neutral-900 dark:prose-a:text-neutral-300 dark:hover:prose-a:text-neutral-100 prose-table:text-sm prose-table:overflow-x-auto prose-li:text-neutral-600 prose-li:text-[14px] prose-li:break-words dark:prose-li:text-neutral-300 prose-hr:border-neutral-200 dark:prose-hr:border-neutral-700 prose-blockquote:border-neutral-300 prose-blockquote:text-neutral-500 dark:prose-blockquote:border-neutral-600 dark:prose-blockquote:text-neutral-400 prose-th:text-neutral-700 dark:prose-th:text-neutral-200 prose-td:text-neutral-600 dark:prose-td:text-neutral-300 prose-pre:overflow-x-auto prose-pre:max-w-full overflow-hidden">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Streaming cursor */}
            {message.isStreaming && message.content && (
              <span className="inline-block h-4 w-1.5 animate-pulse rounded-full bg-neutral-400 dark:bg-neutral-500" />
            )}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700/50 mt-0.5">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
