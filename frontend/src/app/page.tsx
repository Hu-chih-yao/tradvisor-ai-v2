"use client";

import { useState, useCallback } from "react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useChat } from "@/hooks/use-chat";

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
    <div className="flex h-[100dvh] overflow-hidden bg-white dark:bg-neutral-900">
      {/* Sidebar */}
      <ChatSidebar
        currentSessionId={sessionId}
        onSelectSession={loadSession}
        onNewChat={newSession}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header */}
        <header className="h-14 px-5 flex items-center justify-between shrink-0 z-20 border-b border-neutral-200/60 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">
              TradvisorAI
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">TradvisorAI</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-[140px] md:pb-32">
          <ChatMessages
            messages={messages}
            onSuggestionClick={handleSuggestionClick}
          />
        </main>

        {/* Input Area */}
        <footer className="absolute bottom-0 left-0 right-0 p-3 md:p-5 pb-[max(12px,env(safe-area-inset-bottom))] md:pb-5 z-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/0 dark:from-neutral-900 dark:via-neutral-900/95 dark:to-neutral-900/0" />
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
