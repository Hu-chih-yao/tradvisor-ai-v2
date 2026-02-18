"use client";

/**
 * EventFeed — the live inline stream of agent activity.
 *
 * Mirrors demo.py's pattern:
 *   >> Web Search   "NVDA stock price Q3 2024"
 *      → Price $875.43, Market Cap $2.1T...
 *   >> Code         dcf_value = calculate_fcf(...)
 *      → Base: $650 | Conservative: $520 | Optimistic: $820
 *
 * Each tool call is a block. Details (search results, code, output) follow inline.
 */

import { useState } from "react";
import { Globe, Code2, ChevronDown, ChevronRight, FileOutput } from "lucide-react";
import type { LiveEvent, StepActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Tool header row ──────────────────────────────────────────────────────────

function ToolHeader({
  event,
  expanded,
  onToggle,
}: {
  event: LiveEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isSearch = event.tool === "web_search";
  const isCode = event.tool === "code_execution";

  return (
    <button
      onClick={onToggle}
      className="group flex w-full items-start gap-2.5 text-left"
    >
      {/* Tool icon */}
      <div
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded",
          isSearch && "bg-blue-100 dark:bg-blue-900/40",
          isCode && "bg-purple-100 dark:bg-purple-900/40",
          !isSearch && !isCode && "bg-neutral-100 dark:bg-neutral-800"
        )}
      >
        {isSearch && (
          <Globe className="h-3 w-3 text-blue-500 dark:text-blue-400" />
        )}
        {isCode && (
          <Code2 className="h-3 w-3 text-purple-500 dark:text-purple-400" />
        )}
        {!isSearch && !isCode && (
          <Globe className="h-3 w-3 text-neutral-400" />
        )}
      </div>

      {/* Label + description */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.08em]",
              isSearch && "text-blue-500 dark:text-blue-400",
              isCode && "text-purple-500 dark:text-purple-400",
              !isSearch && !isCode && "text-neutral-500"
            )}
          >
            {isSearch ? "Web Search" : isCode ? "Code" : event.tool}
          </span>
          {event.description &&
            event.description !== "Searching the web..." &&
            event.description !== "Running analysis..." && (
              <span className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                {event.description}
              </span>
            )}
        </div>
      </div>

      {/* Expand/collapse toggle */}
      {event.details.length > 0 && (
        <div className="shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-60">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
      )}
    </button>
  );
}

// ── Detail item ───────────────────────────────────────────────────────────────

function DetailItem({ detail }: { detail: StepActivity }) {
  if (detail.type === "search") {
    // Show the actual search query that was run
    const query = detail.metadata?.search_query as string | undefined || detail.content;
    return (
      <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300 font-medium">
        &ldquo;{query}&rdquo;
      </p>
    );
  }

  if (detail.type === "code") {
    return (
      <pre className="mt-1 overflow-x-auto rounded-md border border-neutral-700/30 bg-neutral-900 dark:bg-neutral-950 p-2.5 font-mono text-[11px] leading-relaxed text-green-300 max-h-[160px] overflow-y-auto">
        <code>{detail.content}</code>
      </pre>
    );
  }

  if (detail.type === "output") {
    return (
      <div className="mt-1 flex items-start gap-1.5">
        <FileOutput className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
        <p className="font-mono text-[11px] leading-relaxed text-green-600 dark:text-green-400 whitespace-pre-wrap break-words">
          {detail.content}
        </p>
      </div>
    );
  }

  // info / search results summary
  return (
    <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
      {detail.content}
    </p>
  );
}

// ── Single event block ────────────────────────────────────────────────────────

function EventBlock({ event }: { event: LiveEvent }) {
  const [expanded, setExpanded] = useState(true);
  const hasDetails = event.details.length > 0;

  return (
    <div className="animate-fadeIn">
      <ToolHeader
        event={event}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      {hasDetails && expanded && (
        <div className="ml-7 mt-0.5 space-y-0.5">
          {event.details.map((d, i) => (
            <DetailItem key={i} detail={d} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface EventFeedProps {
  events: LiveEvent[];
}

export function EventFeed({ events }: EventFeedProps) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-2.5 rounded-xl border border-neutral-200/50 bg-neutral-50/40 px-3.5 py-3 dark:border-neutral-700/40 dark:bg-neutral-800/30">
      {events.map((event) => (
        <EventBlock key={event.id} event={event} />
      ))}
    </div>
  );
}
