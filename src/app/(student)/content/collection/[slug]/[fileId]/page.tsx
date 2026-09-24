"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

interface Material {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  contentType: string;
  week: number;
  lecturer: {
    name: string;
  };
}

/** One stored AI exchange as returned by /api/ai/history/[id]. */
interface AIHistoryItem {
  id: string;
  query: string;
  response: string;
  createdAt: string;
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function FileViewerPage({
  params,
}: {
  params: Promise<{ slug: string; fileId: string }>;
}) {
  const router = useRouter();
  const { slug: rawSlug, fileId } = React.use(params);
  const slug = decodeURIComponent(rawSlug);

  // Parse slug: "module-semester" format
  const lastDashIndex = slug.lastIndexOf("-");
  // Named `moduleName` rather than `module`: assigning to `module` shadows the
  // CommonJS global, which Next flags as a build hazard.
  const moduleName = slug.substring(0, lastDashIndex);
  const semester = slug.substring(lastDashIndex + 1);

  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarked, setIsMarked] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);

  // AI chat states
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      content:
        "👋 Hi! I can help you understand this study material. Ask me any questions about what you're reading!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMaterial() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/content/collections/${encodeURIComponent(moduleName)}?semester=${semester}`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (data.success && data.data) {
          const file = (data.data as Material[]).find((item) => item.id === fileId);
          if (file) setMaterial(file);
        }
      } catch (error) {
        if (!controller.signal.aborted) console.error("Failed to fetch material:", error);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void fetchMaterial();
    return () => controller.abort();
  }, [fileId, moduleName, semester]);

  useEffect(() => {
    if (!material) return;
    const controller = new AbortController();

    async function fetchHistory() {
      try {
        const conversationId = `material-${material!.id}`;
        const response = await fetch(`/api/ai/history/${conversationId}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          const historyMessages: Message[] = [];
          data.data.forEach((item: AIHistoryItem) => {
            historyMessages.push(
              { id: `${item.id}-query`, type: "user", content: item.query, timestamp: new Date(item.createdAt) },
              { id: `${item.id}-response`, type: "ai", content: item.response, timestamp: new Date(item.createdAt) },
            );
          });
          setMessages([
            {
              id: "welcome",
              type: "ai",
              content: "👋 Hi! I can help you understand this study material. Ask me any questions about what you're reading!",
              timestamp: new Date(data.data[0].createdAt),
            },
            ...historyMessages,
          ]);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch AI conversation history:", error);
        }
      }
    }

    void fetchHistory();
    return () => controller.abort();
  }, [material]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiLoading, showChat]);

  const handleSendMessage = async () => {
    if (!input.trim() || !material) return;

    const userMessage: Message = {
      id: String(Date.now()),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/ai/study-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input.trim(),
          contentId: material.id,
          conversationId: `material-${material.id}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: String(Date.now() + 1),
          type: "ai",
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const aiMessage: Message = {
          id: String(Date.now() + 1),
          type: "ai",
          content: `⚠️ Failed to get answer: ${data.error || "Please check your query limit."}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const aiMessage: Message = {
        id: String(Date.now() + 1),
        type: "ai",
        content: "❌ Something went wrong while communicating with the assistant. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      setMarkError(null);
      const response = await fetch(`/api/content/${fileId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessType: "view" }),
      });
      if (!response.ok) throw new Error("Progress could not be saved.");
      setIsMarked(true);
    } catch (error) {
      console.error("Failed to mark as read:", error);
      setMarkError("Progress could not be saved. Please try again.");
    }
  };

  const getViewerContent = () => {
    if (!material) return null;

    const lowerFileType = material.fileType.toLowerCase();

    if (lowerFileType === "pdf") {
      return (
        <iframe
          src={`${material.fileUrl}#toolbar=0&navpanes=0`}
          className="w-full h-full"
          title="PDF Viewer"
        />
      );
    }

    if (lowerFileType === "docx" || lowerFileType === "pptx") {
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        material.fileUrl
      )}&embedded=true`;
      return (
        <iframe
          src={googleDocsUrl}
          className="w-full h-full"
          title="Document Viewer"
        />
      );
    }

    if (
      lowerFileType === "jpeg" ||
      lowerFileType === "jpg" ||
      lowerFileType === "png"
    ) {
      return (
        <Image
          src={material.fileUrl}
          alt={material.title}
          fill
          sizes="(max-width: 1024px) 100vw, 70vw"
          className="object-contain bg-muted/10 p-4"
        />
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/10">
        <div className="text-center p-8 bg-card border rounded-2xl max-w-sm shadow-sm">
          <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
          <a href={material.fileUrl} download>
            <Button className="cursor-pointer">
              <Download className="mr-2 w-4 h-4" />
              Download File
            </Button>
          </a>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading study material...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <p className="text-muted-foreground">File not found</p>
        <Button onClick={() => router.back()} className="cursor-pointer">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0 bg-card">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground line-clamp-1">
              {material.title}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-8">
            Week {material.week} • {material.contentType.replace(/_/g, " ")} • By {material.lecturer.name}
          </p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <Button
            variant={showChat ? "default" : "outline"}
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-2 cursor-pointer transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {showChat ? "Hide Assistant" : "Ask AI"}
          </Button>
        </div>
      </div>

      {/* Main split-screen container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Viewer */}
        <div className="flex-1 overflow-hidden bg-muted/10 relative">
          {getViewerContent()}
        </div>

        {/* Right Side: Ask AI Sidebar */}
        {showChat && (
          <div className="w-[380px] border-l flex flex-col bg-card flex-shrink-0 shadow-lg animate-in slide-in-from-right duration-200">
            {/* Sidebar Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Study Assistant</h3>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Gemini 2.0 Flash</span>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-muted-foreground hover:text-foreground rounded-md p-1 hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4 bg-muted/5">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs font-sans ${
                        msg.type === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card text-foreground border rounded-tl-none"
                      }`}
                    >
                      {msg.type === "user" ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                      <div
                        className={`text-[9px] mt-1.5 text-right opacity-70 ${
                          msg.type === "user"
                            ? "text-primary-foreground/85"
                            : "text-muted-foreground"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border text-foreground px-4 py-3 rounded-2xl text-sm rounded-tl-none shadow-xs flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t bg-card flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Ask a question about this..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isAiLoading}
                  className="text-sm h-10 flex-1 border-muted focus-visible:ring-primary"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isAiLoading || !input.trim()}
                  className="h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Controls */}
      <div className="border-t px-6 py-4 flex items-center justify-between flex-shrink-0 bg-card">
        <div className="flex flex-wrap items-center gap-3">
          <a href={material.fileUrl} download>
            <Button variant="outline" className="cursor-pointer">
              <Download className="mr-2 w-4 h-4" />
              Download File
            </Button>
          </a>
          <Button
            onClick={handleMarkAsRead}
            variant={isMarked ? "outline" : "default"}
            disabled={isMarked}
            className="cursor-pointer"
          >
            {isMarked ? "✓ Marked as Read" : "Mark as Read"}
          </Button>
          {markError ? (
            <p className="text-sm text-destructive" role="alert">{markError}</p>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Study material added by lecturer
        </p>
      </div>
    </div>
  );
}
