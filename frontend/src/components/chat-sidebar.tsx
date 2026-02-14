"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  LogOut,
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
  /** When true, always show expanded (used for mobile overlay) */
  forceExpanded?: boolean;
}

export function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  refreshTrigger,
  forceExpanded,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [collapsed, setCollapsed] = useState(true);
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

  const isExpanded = forceExpanded || !collapsed;

  /* ─── Collapsed state (desktop only, never shown when forceExpanded) ─── */
  if (!isExpanded) {
    return (
      <div className="hidden lg:flex w-14 flex-col items-center border-r border-neutral-200/60 bg-neutral-50 py-3.5 dark:border-neutral-800 dark:bg-neutral-950">
        <button
          onClick={() => setCollapsed(false)}
          className="mb-4 rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors"
          title="Expand sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        <div className="h-px w-6 bg-neutral-200 dark:bg-neutral-800 mb-3" />

        <button
          onClick={onNewChat}
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors"
          title="New chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-[17rem] flex-col border-r border-neutral-200/60 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 h-full",
        forceExpanded ? "" : "hidden lg:flex"
      )}
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">
          TradvisorAI
        </span>
        {!forceExpanded && (
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px mx-4 bg-neutral-200/60 dark:bg-neutral-800" />

      {/* ─── New Chat Button ─── */}
      <div className="px-3 py-3.5">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-neutral-200/60 bg-white px-3.5 py-2.5 text-[13px] font-medium text-neutral-600 shadow-sm transition-all hover:bg-neutral-50 hover:shadow active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* ─── Session List ─── */}
      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500 dark:border-neutral-700 dark:border-t-neutral-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-6 w-6 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-[13px] font-medium text-neutral-400 dark:text-neutral-500">
              No conversations yet
            </p>
            <p className="text-[11px] text-neutral-400/60 mt-1 dark:text-neutral-500/50">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 px-3 pb-2 dark:text-neutral-500">Recent</p>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors",
                  currentSessionId === session.id
                    ? "bg-neutral-200/50 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-300"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-40" />
                <span className="flex-1 truncate leading-snug">
                  {session.title}
                </span>
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className="shrink-0 rounded-lg p-1 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
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
        <div className="h-px bg-neutral-200/60 dark:bg-neutral-800 mb-2.5" />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
