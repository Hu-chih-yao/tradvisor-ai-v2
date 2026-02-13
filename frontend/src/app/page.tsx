"use client";

import { useState, useCallback } from "react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useChat } from "@/hooks/use-chat";
import { TrendingUp, Sparkles } from "lucide-react";

export default function ChatPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [suggestionValue, setSuggestionValue] = useState<string | undefined>();

  const handleSessionCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const {
    messages,
    isLoading,
    sessionId,
    sendMessage,
    loadSession,
    newSession,
    stop,
  } = useChat({
    onSessionCreated: handleSessionCreated,
  });

  function handleSuggestionClick(text: string) {
    setSuggestionValue(text);
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-editorial">
      {/* Sidebar */}
      <ChatSidebar
        currentSessionId={sessionId}
        onSelectSession={loadSession}
        onNewChat={newSession}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header — editorial glass bar */}
        <header className="glass-bar h-14 px-5 flex items-center justify-between shrink-0 z-20">
          {/* Mobile: Logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/20">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                <Sparkles className="h-2 w-2 text-cyan-500" />
              </div>
            </div>
            <span className="font-serif text-[15px] font-semibold text-slate-800 dark:text-white tracking-tight">
              <span className="italic">Tradvisor</span>AI
            </span>
          </div>

          {/* Desktop: Editorial label + live indicator */}
          <div className="hidden lg:flex items-center gap-4">
            <p className="editorial-label">AI Equity Research</p>
            <div className="badge-live">Live</div>
          </div>

          {/* Right: Theme toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Messages Area — scrollable with bottom padding for input */}
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-[140px] md:pb-32">
          <ChatMessages
            messages={messages}
            onSuggestionClick={handleSuggestionClick}
          />
        </main>

        {/* Input Area — anchored to bottom */}
        <footer className="absolute bottom-0 left-0 right-0 p-3 md:p-5 pb-[max(12px,env(safe-area-inset-bottom))] md:pb-5 z-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-[#f2f5f8] via-[#f2f5f8]/95 to-[#f2f5f8]/0 dark:from-[#0c1322] dark:via-[#0c1322]/95 dark:to-[#0c1322]/0" />
          <div className="relative pointer-events-auto">
            <ChatInput
              onSend={sendMessage}
              onStop={stop}
              isLoading={isLoading}
              externalValue={suggestionValue}
              onExternalValueConsumed={() => setSuggestionValue(undefined)}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
