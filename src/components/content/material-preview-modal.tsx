"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Download, MessageCircle, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface MaterialPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  fileType: string;
  contentId: string;
}

export function MaterialPreviewModal({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileType,
  contentId,
}: MaterialPreviewModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "👋 Hi! I can help you understand this material. Ask me any questions about what you're reading!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: String(messages.length + 1),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/study-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          contentId,
          conversationId: "material-preview",
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: String(messages.length + 2),
          type: "ai",
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPreviewComponent = () => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return (
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full rounded-lg"
            title={title}
          />
        );
      case "jpeg":
      case "jpg":
      case "png":
      case "gif":
        return (
          <img
            src={fileUrl}
            alt={title}
            className="w-full h-full object-contain rounded-lg"
          />
        );
      case "pptx":
      case "ppt":
        return (
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground font-medium mb-4">
                Preview not available for presentations
              </p>
              <a href={fileUrl} download className="text-primary hover:underline">
                Download to view
              </a>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground font-medium mb-4">Preview not available</p>
              <a href={fileUrl} download className="text-primary hover:underline">
                Download file
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{fileType.toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={fileUrl} download>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Preview Section */}
          <div className="flex-1 bg-muted/20 rounded-lg overflow-hidden">
            {getPreviewComponent()}
          </div>

          {/* Chat Section */}
          <div className="w-80 bg-card border rounded-lg flex flex-col">
            {/* Chat Header */}
            <div className="p-3 border-b bg-muted/30">
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex items-center justify-between w-full hover:opacity-70"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Ask AI</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showChat ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.type === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground px-3 py-2 rounded-lg text-sm rounded-bl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  className="text-sm h-9"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="h-9 px-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
