"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Activity, User, Loader2 } from "lucide-react";
import type { UIMessage } from "@/lib/types";
import { AgentStream } from "./agent-stream";
import { EventFeed } from "./event-feed";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: UIMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 animate-fadeIn", isUser ? "justify-end" : "justify-start")}>
      {/* AI avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700/50 mt-0.5">
          <Activity className="h-4 w-4" />
        </div>
      )}

      <div className={cn("max-w-[85%] md:max-w-[82%] min-w-0", isUser ? "items-end" : "items-start")}>

        {/* ── User bubble ── */}
        {isUser && (
          <div className="rounded-2xl rounded-tr-md bg-neutral-800 px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-sm dark:bg-neutral-200 dark:text-neutral-900 break-words">
            {message.content}
          </div>
        )}

        {/* ── Assistant message ── */}
        {!isUser && (
          <div className="space-y-3 w-full">

            {/* 1. Plan checklist — always visible while working */}
            {message.plan && (
              <AgentStream
                plan={message.plan}
                collapsed={!!(message.plan.is_complete && message.content)}
              />
            )}

            {/* 2. Live event feed — searches and code popping out as they happen */}
            {message.liveEvents && message.liveEvents.length > 0 && (
              <EventFeed events={message.liveEvents} />
            )}

            {/* 3. Initial "Analyzing..." spinner before anything arrives */}
            {message.isStreaming && !message.plan && !message.liveEvents?.length && !message.content && (
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200/60 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800 w-fit">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                <span className="text-[12px] font-medium text-neutral-400 dark:text-neutral-500">
                  Analyzing...
                </span>
              </div>
            )}

            {/* 4. Final answer — the main content, streams in word by word */}
            {message.content && (
              <div
                className={cn(
                  "prose prose-sm prose-neutral max-w-none dark:prose-invert overflow-hidden",
                  "prose-headings:font-semibold prose-headings:tracking-tight",
                  "prose-headings:text-neutral-900 dark:prose-headings:text-neutral-50",
                  "prose-p:text-[14px] prose-p:leading-relaxed prose-p:text-neutral-700 dark:prose-p:text-neutral-200 prose-p:break-words",
                  "prose-li:text-[14px] prose-li:text-neutral-700 dark:prose-li:text-neutral-200 prose-li:break-words",
                  "prose-strong:text-neutral-900 dark:prose-strong:text-neutral-50",
                  "prose-code:text-[13px] prose-code:text-neutral-700 dark:prose-code:text-neutral-200 prose-code:break-words",
                  "prose-pre:overflow-x-auto prose-pre:max-w-full",
                  "prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline prose-a:break-all",
                  "prose-table:text-sm",
                  "prose-hr:border-neutral-200 dark:prose-hr:border-neutral-700",
                  "prose-blockquote:text-neutral-500 dark:prose-blockquote:text-neutral-400"
                )}
              >
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
