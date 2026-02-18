"use client";

import { Activity, BarChart3, Briefcase } from "lucide-react";
import type { ToolCallEvent } from "@/lib/types";

interface ToolIndicatorProps {
  toolCalls: ToolCallEvent[];
}

const TOOL_DISPLAY: Record<
  string,
  { icon: typeof Activity; label: string; color: string }
> = {
  web_search: {
    icon: Activity,
    label: "Gathering market intelligence",
    color:
      "text-neutral-600 bg-neutral-50 border-neutral-200/50 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  },
  code_execution: {
    icon: BarChart3,
    label: "Building financial models",
    color:
      "text-neutral-600 bg-neutral-50 border-neutral-200/50 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  },
};

export function ToolIndicator({ toolCalls }: ToolIndicatorProps) {
  if (toolCalls.length === 0) return null;

  const uniqueCalls = toolCalls.reduce<ToolCallEvent[]>((acc, tc) => {
    if (acc.length === 0 || acc[acc.length - 1].name !== tc.name) {
      acc.push(tc);
    }
    return acc;
  }, []);

  return (
    <div className="flex flex-wrap gap-1.5">
      {uniqueCalls.map((tc, i) => {
        const config = TOOL_DISPLAY[tc.name] || {
          icon: Briefcase,
          label: "Processing data",
          color:
            "text-neutral-500 bg-neutral-50 border-neutral-200/50 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
        };
        const Icon = config.icon;

        return (
          <div
            key={`${tc.name}-${i}`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase transition-all duration-200 animate-scaleIn ${config.color}`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </div>
        );
      })}
    </div>
  );
}
