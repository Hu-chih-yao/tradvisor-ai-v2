"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  LogOut,
  TrendingUp,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatSession } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
}

export function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  refreshTrigger,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setSessions(data as ChatSession[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshTrigger]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", id);
    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) {
        onNewChat();
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ─── Collapsed state ─── */
  if (collapsed) {
    return (
      <div className="flex w-14 flex-col items-center bg-sidebar border-r border-slate-200/20 py-3.5 dark:border-slate-700/20">
        <button
          onClick={() => setCollapsed(false)}
          className="mb-4 rounded-lg p-2 text-slate-400 hover:bg-blue-50/50 hover:text-slate-600 dark:hover:bg-slate-800/50 dark:hover:text-slate-300 transition-all"
          title="Expand sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        {/* Mini logo */}
        <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 shadow-md shadow-blue-500/12 ring-1 ring-blue-400/15">
          <TrendingUp className="h-3.5 w-3.5 text-white" />
        </div>

        <div className="editorial-divider w-6 mb-3" />

        <button
          onClick={onNewChat}
          className="rounded-lg p-2 text-slate-400 hover:bg-blue-50/60 hover:text-blue-600 dark:hover:bg-blue-900/15 dark:hover:text-blue-400 transition-all"
          title="New chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-[17rem] flex-col bg-sidebar border-r border-slate-200/20 dark:border-slate-700/20">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 shadow-md">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-slate-800 dark:text-white tracking-tight">
            TradvisorAI
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50/50 hover:text-slate-600 dark:hover:bg-slate-800/50 dark:hover:text-slate-300 transition-all"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Editorial divider */}
      <div className="editorial-divider mx-4" />

      {/* ─── New Chat Button ─── */}
      <div className="px-3 py-3.5">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-xl border border-blue-200/30 bg-blue-50/30 px-3.5 py-2.5 text-[13px] font-medium text-slate-600 shadow-sm transition-all duration-200 hover:bg-blue-50/60 hover:text-blue-700 hover:border-blue-200/50 hover:shadow-md active:scale-[0.98] dark:border-blue-800/20 dark:bg-blue-900/10 dark:text-slate-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800/30"
        >
          <Plus className="h-4 w-4" />
          New Research
        </button>
      </div>

      {/* ─── Session List ─── */}
      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200/60 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50/40 dark:bg-blue-900/10 mb-4">
              <MessageSquare className="h-6 w-6 text-blue-300/60 dark:text-blue-600/40" />
            </div>
            <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
              No research yet
            </p>
            <p className="text-[11px] text-slate-400/50 mt-1.5 leading-relaxed max-w-[10rem] dark:text-slate-500/40">
              Start a new session to analyze any stock
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            <p className="editorial-label px-3 pb-2">Recent</p>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] transition-all duration-150",
                  currentSessionId === session.id
                    ? "bg-blue-50/50 text-blue-700 border border-blue-100/40 shadow-sm dark:bg-blue-900/15 dark:text-blue-300 dark:border-blue-800/25"
                    : "text-slate-500 hover:bg-blue-50/30 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/25 dark:hover:text-slate-300"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-40" />
                <span className="flex-1 truncate leading-snug">
                  {session.title}
                </span>
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className="shrink-0 rounded-lg p-1 opacity-0 transition-all hover:bg-red-50/60 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="px-3 py-2.5">
        <div className="editorial-divider mb-2.5" />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-slate-400 transition-all duration-150 hover:bg-slate-50/40 hover:text-slate-600 dark:hover:bg-slate-800/25 dark:hover:text-slate-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
