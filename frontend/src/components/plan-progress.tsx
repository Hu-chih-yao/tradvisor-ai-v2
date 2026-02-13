"use client";

import { CheckCircle2, Circle, Loader2, SkipForward } from "lucide-react";
import type { PlanUpdateEvent, PlanStep } from "@/lib/types";
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

export function PlanProgress({ plan }: PlanProgressProps) {
  const completedCount = plan.steps.filter(
    (s) => s.status === "completed"
  ).length;
  const totalCount = plan.steps.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="glass-panel rounded-xl p-4 shadow-sm animate-scaleIn">
      {/* Header */}
      {plan.task_summary && (
        <p className="mb-3 text-[13px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
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
      <div className="space-y-2.5">
        {plan.steps.map((step) => {
          const config = STATUS_CONFIG[step.status];
          const Icon = config.icon;

          return (
            <div key={step.id} className="flex items-start gap-2.5">
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  config.color,
                  step.status === "in_progress" && "animate-spin"
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[13px] leading-relaxed",
                    config.textStyle
                  )}
                >
                  {step.description}
                </p>
                {step.result && (
                  <p className="mt-0.5 text-[11px] text-slate-400/60 truncate dark:text-slate-500/60">
                    {step.result}
                  </p>
                )}
              </div>
            </div>
          );
        })}
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
