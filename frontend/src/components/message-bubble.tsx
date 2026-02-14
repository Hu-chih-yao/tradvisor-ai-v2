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
      {/* AI Avatar — blue-gray gradient with institutional feel */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 shadow-sm ring-1 ring-blue-200/30 dark:from-blue-900/25 dark:to-cyan-900/15 dark:text-blue-400 dark:ring-blue-700/25 mt-0.5">
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
        {/* User message — dark slate pill */}
        {isUser && (
          <div className="rounded-2xl rounded-tr-md bg-slate-800 px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-md shadow-slate-900/8 dark:bg-slate-100 dark:text-slate-900 dark:shadow-none break-words overflow-wrap-anywhere">
            {message.content}
          </div>
        )}

        {/* Assistant message */}
        {!isUser && (
          <div className="space-y-2.5">
            {/* Plan progress — shows analysis steps without exposing internals */}
            {message.plan && <PlanProgress plan={message.plan} />}

            {/* Tool activity — subtle, not exposing server-side details */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <ToolIndicator toolCalls={message.toolCalls} />
            )}

            {/* Thinking / loading state — premium */}
            {message.isStreaming && !message.content && !message.plan && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 glass-panel rounded-lg px-3 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  <span className="animate-pulse-subtle text-[12px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                    Analyzing...
                  </span>
                </div>
              </div>
            )}

            {/* Markdown content — institutional typography */}
            {message.content && (
              <div className="prose prose-sm prose-slate max-w-none dark:prose-invert prose-headings:font-serif prose-headings:tracking-tight prose-headings:font-semibold prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-[14px] prose-p:break-words dark:prose-p:text-slate-300 prose-strong:text-slate-800 dark:prose-strong:text-slate-100 prose-code:text-cyan-600 prose-code:font-medium prose-code:text-[13px] prose-code:break-words dark:prose-code:text-cyan-400 prose-a:text-blue-600 prose-a:no-underline prose-a:break-all hover:prose-a:underline dark:prose-a:text-blue-400 prose-table:text-sm prose-table:overflow-x-auto prose-li:text-slate-600 prose-li:text-[14px] prose-li:break-words dark:prose-li:text-slate-300 prose-hr:border-slate-200/50 dark:prose-hr:border-slate-700/30 prose-blockquote:border-blue-300/60 prose-blockquote:text-slate-500 dark:prose-blockquote:border-blue-700/50 dark:prose-blockquote:text-slate-400 prose-th:text-slate-700 dark:prose-th:text-slate-200 prose-td:text-slate-600 dark:prose-td:text-slate-300 prose-pre:overflow-x-auto prose-pre:max-w-full overflow-hidden">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Streaming cursor — gradient pulse */}
            {message.isStreaming && message.content && (
              <span className="inline-block h-4 w-1.5 animate-pulse rounded-full bg-gradient-to-b from-cyan-400 to-blue-600" />
            )}
          </div>
        )}
      </div>

      {/* User avatar — subtle blue-gray */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-sm ring-1 ring-slate-200/40 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700/30 mt-0.5">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
