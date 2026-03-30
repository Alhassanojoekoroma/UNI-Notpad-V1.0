"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, PanelLeftClose, PanelLeftOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useSendAIQuery,
  useAIConversation,
  useRateResponse,
} from "@/hooks/use-ai";
import { ChatMessage } from "./chat-message";
import { ChatHistory } from "./chat-history";
import { SourceDrawer, SelectedSourceChips } from "./source-drawer";
import { ChatSettingsPopover, type ChatSettings } from "./chat-settings";
import { QueryStatus } from "./query-status";
import { LearningStudio } from "./learning-studio";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  rating?: number | null;
};

export function ChatInterface() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Chat state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<ChatSettings>({
    learningLevel: "intermediate",
    chatStyle: "default",
    responseLength: "default",
    customInstructions: "",
  });

  // Hooks
  const { send, stop, streamingText, isStreaming } = useSendAIQuery();
  const { data: conversationMessages } = useAIConversation(activeConversationId);
  const rateResponse = useRateResponse();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation messages when switching
  useEffect(() => {
    if (conversationMessages) {
      setMessages(
        conversationMessages.map((m) => [
          { role: "user" as const, content: m.query },
          {
            id: m.id,
            role: "assistant" as const,
            content: m.response,
            rating: m.satisfactionRating,
          },
        ]).flat()
      );
    }
  }, [conversationMessages]);

  // Auto-scroll on new messages / streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInputValue("");
    inputRef.current?.focus();
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setSidebarOpen(false);
  }, []);

  const handleSend = async () => {
    const query = inputValue.trim();
    if (!query || isStreaming) return;

    setInputValue("");

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: query }]);

    try {
      const result = await send({
        query,
        conversationId: activeConversationId || undefined,
        sourceContentIds: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
        learningLevel: settings.learningLevel,
        chatStyle: settings.chatStyle,
        responseLength: settings.responseLength,
        customInstructions: settings.chatStyle === "custom" ? settings.customInstructions : undefined,
      });

      if (result) {
        // Update conversation ID if this was a new chat
        if (!activeConversationId) {
          setActiveConversationId(result.conversationId);
        }

        // Add assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: result.id,
            role: "assistant",
            content: result.response,
            rating: null,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Something went wrong. Please try again."}`,
        },
      ]);
    }
  };

  const handleRate = (interactionId: string, rating: number) => {
    rateResponse.mutate({ interactionId, rating });
    setMessages((prev) =>
      prev.map((m) => (m.id === interactionId ? { ...m, rating } : m))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Chat panel content (shared between mobile and desktop)
  const chatPanel = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {isMobile ? (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Chat history" />
                }
              >
                <PanelLeftOpen className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <ChatHistory
                  activeConversationId={activeConversationId}
                  onSelectConversation={handleSelectConversation}
                  onNewChat={handleNewChat}
                />
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Hide history" : "Show history"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
            </Button>
          )}
          <QueryStatus />
        </div>
        <div className="flex items-center gap-1">
          <ChatSettingsPopover settings={settings} onChange={setSettings} />
          <SourceDrawer
            selectedIds={selectedSourceIds}
            onSelectionChange={setSelectedSourceIds}
          />
          <LearningStudio selectedSourceIds={selectedSourceIds} />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Send className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">AI Study Assistant</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ask questions about your course materials, get explanations, or use
              learning tools to study more effectively.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage
              key={`${msg.id || i}-${i}`}
              role={msg.role}
              content={msg.content}
              id={msg.id}
              rating={msg.rating}
              onRate={
                msg.role === "assistant" && msg.id
                  ? (rating) => handleRate(msg.id!, rating)
                  : undefined
              }
            />
          ))}

          {isStreaming && streamingText && (
            <ChatMessage
              role="assistant"
              content={streamingText}
              isStreaming
            />
          )}

          {isStreaming && !streamingText && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-4 py-3">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Source chips */}
      {selectedSourceIds.length > 0 && (
        <div className="border-t px-4 pt-2">
          <SelectedSourceChips
            selectedIds={selectedSourceIds}
            onRemove={(id) =>
              setSelectedSourceIds(selectedSourceIds.filter((s) => s !== id))
            }
          />
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your course materials..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={stop}
              className="shrink-0"
              aria-label="Stop generating"
            >
              <span className="size-3 rounded-sm bg-white" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="shrink-0"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile: single column
  if (isMobile) {
    return <div className="flex h-full flex-col">{chatPanel}</div>;
  }

  // Desktop: resizable panels
  return (
    <div className="flex h-full">
      <ResizablePanelGroup orientation="horizontal">
        {sidebarOpen && (
          <>
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <ChatHistory
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        <ResizablePanel defaultSize={sidebarOpen ? 75 : 100}>
          {chatPanel}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
