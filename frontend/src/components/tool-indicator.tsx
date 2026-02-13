"use client";

import { Activity, BarChart3, Briefcase } from "lucide-react";
import type { ToolCallEvent } from "@/lib/types";

interface ToolIndicatorProps {
  toolCalls: ToolCallEvent[];
}

/*
  Tool calls are presented as high-value analysis activities.
  Server-side mechanics (web_search, code_execution) are abstracted
  into professional language the user recognizes as institutional research.
*/
const TOOL_DISPLAY: Record<
  string,
  { icon: typeof Activity; label: string; color: string }
> = {
  web_search: {
    icon: Activity,
    label: "Gathering market intelligence",
    color:
      "text-blue-600 bg-blue-50/50 border-blue-200/30 dark:bg-blue-900/12 dark:text-blue-400 dark:border-blue-800/20",
  },
  code_execution: {
    icon: BarChart3,
    label: "Building financial models",
    color:
      "text-cyan-600 bg-cyan-50/50 border-cyan-200/30 dark:bg-cyan-900/12 dark:text-cyan-400 dark:border-cyan-800/20",
  },
};

export function ToolIndicator({ toolCalls }: ToolIndicatorProps) {
  if (toolCalls.length === 0) return null;

  // Deduplicate consecutive same-type tool calls for cleaner UX
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
            "text-slate-500 bg-slate-50/50 border-slate-200/30 dark:bg-slate-800/20 dark:border-slate-700/20",
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
