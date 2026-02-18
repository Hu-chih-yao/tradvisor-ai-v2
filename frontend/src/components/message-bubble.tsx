"use client";

/**
 * MessageBubble — Cursor-style chat message.
 *
 * While working: compact inline action log (searches, code, pages visited).
 * When done: actions collapse into a summary pill, final answer is prominent below.
 */

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Activity,
  User,
  Loader2,
  Globe,
  Code2,
  Search,
  FileOutput,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import type { UIMessage, LiveEvent, StepActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Compact action item (one line, expandable) ──────────────────────────────

function ActionItem({ event }: { event: LiveEvent }) {
  const [open, setOpen] = useState(false);
  const isSearch = event.tool === "web_search";
  const hasDetails = event.details.length > 0;

  return (
    <div>
      <button
        onClick={() => hasDetails && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] transition-colors",
          hasDetails && "hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
          !hasDetails && "cursor-default"
        )}
      >
        {isSearch ? (
          <Search className="h-3 w-3 shrink-0 text-blue-400" />
        ) : (
          <Code2 className="h-3 w-3 shrink-0 text-purple-400" />
        )}
        <span className="flex-1 truncate text-neutral-600 dark:text-neutral-300">
          {event.description || (isSearch ? "Searching..." : "Running code...")}
        </span>
        {hasDetails && (
          open ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-neutral-400 opacity-50" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-neutral-400 opacity-50" />
          )
        )}
      </button>
      {open && hasDetails && (
        <div className="ml-7 mt-0.5 mb-1 space-y-1">
          {event.details.map((d, i) => (
            <DetailBlock key={i} detail={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DetailBlock({ detail }: { detail: StepActivity }) {
  if (detail.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-md bg-neutral-900 dark:bg-neutral-950 p-2 font-mono text-[11px] leading-relaxed text-green-300 max-h-[140px] overflow-y-auto border border-neutral-700/30">
        <code>{detail.content}</code>
      </pre>
    );
  }
  if (detail.type === "output") {
    return (
      <div className="flex items-start gap-1.5">
        <FileOutput className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
        <p className="font-mono text-[11px] text-green-600 dark:text-green-400 whitespace-pre-wrap break-words max-h-[100px] overflow-y-auto">
          {detail.content}
        </p>
      </div>
    );
  }
  if (detail.type === "search") {
    return (
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
        {detail.metadata?.search_query as string || detail.content}
      </p>
    );
  }
  return (
    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
      {detail.content}
    </p>
  );
}

// ── Activity feed: inline actions while working, pill when done ──────────────

function ActivityFeed({
  events,
  isStreaming,
  hasContent,
}: {
  events: LiveEvent[];
  isStreaming?: boolean;
  hasContent: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDone = !isStreaming && hasContent;

  if (events.length === 0) return null;

  // Count searches vs code
  const searchCount = events.filter((e) => e.tool === "web_search").length;
  const codeCount = events.filter((e) => e.tool !== "web_search").length;

  // ── Collapsed pill (after final answer arrives) ────────────────────────
  if (isDone && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="group flex items-center gap-2 rounded-lg border border-neutral-200/50 bg-neutral-50/60 px-2.5 py-1.5 text-left transition-colors hover:bg-neutral-100/70 dark:border-neutral-700/40 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/70"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-neutral-400" />
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
          {searchCount > 0 && `${searchCount} searches`}
          {searchCount > 0 && codeCount > 0 && " · "}
          {codeCount > 0 && `${codeCount} code runs`}
        </span>
        <ChevronRight className="h-3 w-3 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-60" />
      </button>
    );
  }

  // ── Expanded inline list ───────────────────────────────────────────────
  return (
    <div className="space-y-0.5 rounded-lg border border-neutral-200/40 bg-neutral-50/30 py-1 dark:border-neutral-700/30 dark:bg-neutral-800/20">
      {isDone && (
        <button
          onClick={() => setExpanded(false)}
          className="flex w-full items-center gap-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>
            {searchCount > 0 && `${searchCount} searches`}
            {searchCount > 0 && codeCount > 0 && " · "}
            {codeCount > 0 && `${codeCount} code runs`}
          </span>
          <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
        </button>
      )}
      {events.map((event) => (
        <ActionItem key={event.id} event={event} />
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: UIMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 animate-fadeIn", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700/50 mt-1">
          <Activity className="h-3.5 w-3.5" />
        </div>
      )}

      <div className={cn("max-w-[85%] md:max-w-[80%] min-w-0", isUser ? "items-end" : "items-start")}>
        {/* User bubble */}
        {isUser && (
          <div className="rounded-2xl rounded-tr-md bg-neutral-800 px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-sm dark:bg-neutral-200 dark:text-neutral-900 break-words">
            {message.content}
          </div>
        )}

        {/* Assistant */}
        {!isUser && (
          <div className="space-y-2.5 w-full">
            {/* Plan summary — just the task name while working */}
            {message.plan && !message.plan.is_complete && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-200">
                  {message.plan.task_summary}
                </span>
              </div>
            )}

            {/* Live action feed — compact inline items */}
            {message.liveEvents && message.liveEvents.length > 0 && (
              <ActivityFeed
                events={message.liveEvents}
                isStreaming={message.isStreaming}
                hasContent={!!message.content}
              />
            )}

            {/* Initial spinner */}
            {message.isStreaming && !message.plan && !message.liveEvents?.length && !message.content && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                <span className="text-[12px] text-neutral-400">Thinking...</span>
              </div>
            )}

            {/* Final answer */}
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

      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700/50 mt-1">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}
