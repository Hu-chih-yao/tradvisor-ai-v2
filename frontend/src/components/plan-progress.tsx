"use client";

import { CheckCircle2, Circle, Loader2, SkipForward, Code2, Search, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { PlanUpdateEvent, PlanStep, StepActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlanProgressProps {
  plan: PlanUpdateEvent;
}

const STATUS_CONFIG: Record<
  PlanStep["status"],
  { icon: typeof Circle; color: string; textStyle: string }
> = {
  pending: {
    icon: Circle,
    color: "text-slate-300 dark:text-slate-600",
    textStyle: "text-slate-400 dark:text-slate-500",
  },
  in_progress: {
    icon: Loader2,
    color: "text-cyan-500",
    textStyle: "text-blue-600 dark:text-blue-400 font-medium",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-blue-500",
    textStyle: "text-slate-700 dark:text-slate-300",
  },
  skipped: {
    icon: SkipForward,
    color: "text-slate-400",
    textStyle: "text-slate-400 line-through",
  },
};

const ACTIVITY_CONFIG: Record<
  StepActivity["type"],
  { icon: typeof Code2; color: string }
> = {
  code: {
    icon: Code2,
    color: "text-purple-500 dark:text-purple-400",
  },
  search: {
    icon: Search,
    color: "text-blue-500 dark:text-blue-400",
  },
  output: {
    icon: FileText,
    color: "text-green-500 dark:text-green-400",
  },
  info: {
    icon: FileText,
    color: "text-slate-500 dark:text-slate-400",
  },
};

function ActivityItem({ activity }: { activity: StepActivity }) {
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-2 mt-1.5 ml-6">
      <Icon className={cn("h-3 w-3 mt-0.5 shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        {activity.type === "code" && (
          <pre className="text-[11px] bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 rounded-lg p-2.5 overflow-x-auto font-mono leading-relaxed border border-slate-700/30">
            <code>{activity.content}</code>
          </pre>
        )}
        {activity.type === "output" && (
          <div className="text-[11px] bg-green-50/60 dark:bg-green-900/10 text-green-700 dark:text-green-300 rounded-lg p-2 border border-green-200/40 dark:border-green-800/20 font-mono">
            {activity.content}
          </div>
        )}
        {activity.type === "search" && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            {activity.metadata?.search_query && (
              <span className="font-medium">"{activity.metadata.search_query}"</span>
            )}
            {activity.content && (
              <div className="mt-1 text-slate-600 dark:text-slate-300 not-italic">
                → {activity.content}
              </div>
            )}
          </div>
        )}
        {activity.type === "info" && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {activity.content}
          </p>
        )}
      </div>
    </div>
  );
}

function StepItem({ step }: { step: PlanStep }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = STATUS_CONFIG[step.status];
  const Icon = config.icon;
  const hasActivities = step.activities && step.activities.length > 0;

  return (
    <div className="border-l-2 border-slate-200/60 dark:border-slate-700/40 pl-3 -ml-0.5">
      {/* Step header */}
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            config.color,
            step.status === "in_progress" && "animate-spin"
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-[13px] leading-relaxed break-words",
                config.textStyle
              )}
            >
              {step.description}
            </p>
            {hasActivities && step.status === "completed" && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="shrink-0 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                )}
              </button>
            )}
          </div>
          {step.result && !hasActivities && (
            <p className="mt-0.5 text-[11px] text-slate-400/60 dark:text-slate-500/60 break-words">
              {step.result}
            </p>
          )}
        </div>
      </div>

      {/* Cursor-style activities */}
      {hasActivities && (isExpanded || step.status === "in_progress") && (
        <div className="mt-2 space-y-1 animate-fadeIn">
          {step.activities.map((activity, idx) => (
            <ActivityItem key={idx} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlanProgress({ plan }: PlanProgressProps) {
  const completedCount = plan.steps.filter(
    (s) => s.status === "completed"
  ).length;
  const totalCount = plan.steps.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="glass-panel rounded-xl p-3 md:p-4 shadow-sm animate-scaleIn max-w-full overflow-hidden">
      {/* Header */}
      {plan.task_summary && (
        <p className="mb-3 text-[13px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight break-words">
          {plan.task_summary}
        </p>
      )}

      {/* Progress bar — cyan-to-blue gradient */}
      <div className="mb-3.5 h-[3px] w-full overflow-hidden rounded-full bg-blue-100/50 dark:bg-slate-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-700 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {plan.steps.map((step) => (
          <StepItem key={step.id} step={step} />
        ))}
      </div>

      {/* Completion indicator */}
      {plan.is_complete && (
        <div className="mt-3.5 flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-[0.12em] uppercase">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Analysis complete
        </div>
      )}
    </div>
  );
}
