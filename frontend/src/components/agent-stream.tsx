"use client";

/**
 * AgentStream — compact plan checklist.
 *
 * Shows the todo list of steps with status icons (like demo.py's table).
 * Activities / search results live in EventFeed below this component.
 * When the final answer arrives, this collapses to a small pill.
 */

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  SkipForward,
} from "lucide-react";
import type { PlanUpdateEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgentStreamProps {
  plan: PlanUpdateEvent;
  collapsed?: boolean;
}

export function AgentStream({ plan, collapsed: collapsedProp }: AgentStreamProps) {
  const [userExpanded, setUserExpanded] = useState(false);

  const showCollapsed = collapsedProp && !userExpanded;
  const doneCount = plan.steps.filter((s) => s.status === "completed").length;
  const total = plan.steps.length;

  // ── Collapsed pill (after final answer arrives) ──────────────────────────
  if (showCollapsed) {
    return (
      <button
        onClick={() => setUserExpanded(true)}
        className="group flex w-full items-center gap-2 rounded-lg border border-neutral-200/50 bg-neutral-50/60 px-3 py-1.5 text-left transition-colors hover:bg-neutral-100/60 dark:border-neutral-700/40 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/70 animate-fadeIn"
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <span className="flex-1 truncate text-[12px] text-neutral-500 dark:text-neutral-400">
          {plan.task_summary}
        </span>
        <span className="shrink-0 text-[11px] text-neutral-400">
          {doneCount}/{total} steps
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-50" />
      </button>
    );
  }

  // ── Expanded checklist ────────────────────────────────────────────────────
  const firstPendingIdx = plan.steps.findIndex((s) => s.status === "pending");
  const hasInProgress = plan.steps.some((s) => s.status === "in_progress");

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/60 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/40 animate-scaleIn">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2.5 dark:border-neutral-700/30">
        {plan.is_complete ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-neutral-500 dark:text-neutral-400" />
        )}
        <span className="flex-1 truncate text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">
          {plan.task_summary}
        </span>
        {collapsedProp && userExpanded && (
          <button
            onClick={() => setUserExpanded(false)}
            className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            collapse
          </button>
        )}
      </div>

      {/* Progress bar */}
      {!plan.is_complete && total > 0 && (
        <div className="h-[2px] bg-neutral-100 dark:bg-neutral-700">
          <div
            className="h-full bg-neutral-400 dark:bg-neutral-500 transition-all duration-500"
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>
      )}

      {/* Steps */}
      <div className="divide-y divide-neutral-50 px-3 dark:divide-neutral-700/20">
        {plan.steps.map((step, idx) => {
          const isActive = step.status === "in_progress";
          const isDone = step.status === "completed";
          const isPending = step.status === "pending";
          const isSkipped = step.status === "skipped";
          // Pulse the first pending step when nothing is in_progress yet
          const isNext = !hasInProgress && idx === firstPendingIdx && !plan.is_complete;

          return (
            <div key={step.id} className="flex items-start gap-2 py-1.5 first:pt-2 last:pb-2">
              {isActive && (
                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-neutral-500 dark:text-neutral-400" />
              )}
              {isDone && (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
              )}
              {isPending && isNext && (
                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-neutral-300 dark:text-neutral-600" />
              )}
              {isPending && !isNext && (
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-700" />
              )}
              {isSkipped && (
                <SkipForward className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-700" />
              )}
              <span
                className={cn(
                  "text-[13px] leading-snug",
                  isActive && "font-medium text-neutral-800 dark:text-neutral-100",
                  isDone && "text-neutral-500 dark:text-neutral-400",
                  isPending && isNext && "text-neutral-600 dark:text-neutral-400",
                  isPending && !isNext && "text-neutral-400 dark:text-neutral-600",
                  isSkipped && "text-neutral-300 line-through"
                )}
              >
                {step.description}
              </span>
            </div>
          );
        })}
      </div>

      {plan.is_complete && (
        <div className="flex items-center gap-1.5 border-t border-neutral-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:border-neutral-700/30">
          <CheckCircle2 className="h-3 w-3" />
          Analysis complete
        </div>
      )}
    </div>
  );
}
