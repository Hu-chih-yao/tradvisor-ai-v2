"use client";

/**
 * EventFeed — live inline stream of agent activity.
 *
 * Groups consecutive web searches into a single "Gathering market intelligence (7 searches)"
 * block. Code execution blocks show full code + output inline.
 */

import { useState } from "react";
import {
  Globe,
  Code2,
  ChevronDown,
  ChevronRight,
  FileOutput,
  Search,
} from "lucide-react";
import type { LiveEvent, StepActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Detail rendering ─────────────────────────────────────────────────────────

function DetailItem({ detail }: { detail: StepActivity }) {
  if (detail.type === "search") {
    return (
      <div className="flex items-start gap-1.5 mt-1">
        <Search className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />
        <p className="text-[12px] text-neutral-600 dark:text-neutral-300 font-medium">
          {detail.metadata?.search_query as string || detail.content}
        </p>
      </div>
    );
  }

  if (detail.type === "code") {
    return (
      <pre className="mt-1.5 overflow-x-auto rounded-md border border-neutral-200 bg-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 p-2.5 font-mono text-[11px] leading-relaxed text-green-300 max-h-[180px] overflow-y-auto">
        <code>{detail.content}</code>
      </pre>
    );
  }

  if (detail.type === "output") {
    return (
      <div className="mt-1 flex items-start gap-1.5">
        <FileOutput className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
        <p className="font-mono text-[11px] leading-relaxed text-green-600 dark:text-green-400 whitespace-pre-wrap break-words max-h-[120px] overflow-y-auto">
          {detail.content}
        </p>
      </div>
    );
  }

  // info
  return (
    <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
      {detail.content}
    </p>
  );
}

// ── Grouped search block ─────────────────────────────────────────────────────

function SearchGroup({ events }: { events: LiveEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const count = events.length;
  const allDetails = events.flatMap((e) => e.details);
  const hasDetails = allDetails.length > 0;

  return (
    <div className="animate-fadeIn">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="group flex w-full items-center gap-2.5 text-left"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/40">
          <Globe className="h-3 w-3 text-blue-500 dark:text-blue-400" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-blue-500 dark:text-blue-400">
          Gathering Market Intelligence
        </span>
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
          {count} {count === 1 ? "search" : "searches"}
        </span>
        {hasDetails && (
          <div className="shrink-0 text-neutral-400 opacity-40 group-hover:opacity-70 transition-opacity">
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </div>
        )}
      </button>
      {expanded && hasDetails && (
        <div className="ml-7 mt-1 space-y-0.5">
          {allDetails.map((d, i) => (
            <DetailItem key={i} detail={d} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Code execution block ─────────────────────────────────────────────────────

function CodeBlock({ event }: { event: LiveEvent }) {
  const [expanded, setExpanded] = useState(true);
  const hasDetails = event.details.length > 0;

  return (
    <div className="animate-fadeIn">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="group flex w-full items-center gap-2.5 text-left"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-purple-100 dark:bg-purple-900/40">
          <Code2 className="h-3 w-3 text-purple-500 dark:text-purple-400" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-purple-500 dark:text-purple-400">
          Building Financial Models
        </span>
        {event.description && (
          <span className="truncate text-[12px] text-neutral-500 dark:text-neutral-400 max-w-[300px]">
            {event.description}
          </span>
        )}
        {hasDetails && (
          <div className="shrink-0 text-neutral-400 opacity-40 group-hover:opacity-70 transition-opacity">
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </div>
        )}
      </button>
      {expanded && hasDetails && (
        <div className="ml-7 mt-1 space-y-0.5">
          {event.details.map((d, i) => (
            <DetailItem key={i} detail={d} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface EventFeedProps {
  events: LiveEvent[];
}

export function EventFeed({ events }: EventFeedProps) {
  if (events.length === 0) return null;

  // Group consecutive web searches together, keep code blocks separate
  const groups: Array<{ type: "search_group"; events: LiveEvent[] } | { type: "code"; event: LiveEvent }> = [];

  for (const event of events) {
    if (event.tool === "web_search") {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.type === "search_group") {
        lastGroup.events.push(event);
      } else {
        groups.push({ type: "search_group", events: [event] });
      }
    } else {
      groups.push({ type: "code", event });
    }
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-neutral-200/50 bg-neutral-50/40 px-3.5 py-3 dark:border-neutral-700/40 dark:bg-neutral-800/30">
      {groups.map((group, i) =>
        group.type === "search_group" ? (
          <SearchGroup key={i} events={group.events} />
        ) : (
          <CodeBlock key={i} event={group.event} />
        )
      )}
    </div>
  );
}
