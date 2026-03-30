"use client";

import { useState } from "react";
import { Star, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  id?: string;
  rating?: number | null;
  onRate?: (rating: number) => void;
  isStreaming?: boolean;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (listItems.length === 0 || !listType) return;
    const Tag = listType;
    const items = listItems.map((item, i) => (
      <li key={i}>{renderInline(item)}</li>
    ));
    elements.push(
      <Tag
        key={elements.length}
        className={cn(
          "my-1.5 space-y-0.5 pl-5",
          listType === "ul" ? "list-disc" : "list-decimal"
        )}
      >
        {items}
      </Tag>
    );
    listItems = [];
    listType = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trimStart().startsWith("```")) {
      if (!inCodeBlock) {
        flushList();
        inCodeBlock = true;
        codeLines = [];
      } else {
        elements.push(
          <pre
            key={elements.length}
            className="my-2 overflow-x-auto rounded-md bg-foreground/5 p-3 text-[0.8rem] leading-relaxed"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const sizes: Record<number, string> = {
        1: "text-lg font-semibold mt-3 mb-1.5",
        2: "text-base font-semibold mt-2.5 mb-1",
        3: "text-sm font-semibold mt-2 mb-1",
        4: "text-sm font-medium mt-1.5 mb-0.5",
        5: "text-sm font-medium mt-1 mb-0.5",
        6: "text-sm font-medium mt-1 mb-0.5",
      };
      elements.push(
        <p key={elements.length} className={sizes[level]}>
          {renderInline(content)}
        </p>
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (ulMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(ulMatch[2]);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (olMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(olMatch[2]);
      continue;
    }

    flushList();

    // Empty line
    if (line.trim() === "") {
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={elements.length} className="my-1">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  // Close unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre
        key={elements.length}
        className="my-2 overflow-x-auto rounded-md bg-foreground/5 p-3 text-[0.8rem] leading-relaxed"
      >
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return elements;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match bold, italic, inline code
  const regex = /(\*\*(.+?)\*\*|__(.+?)__|`([^`]+)`|\*(.+?)\*|_(.+?)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] || match[3]) {
      // Bold
      parts.push(
        <strong key={parts.length} className="font-semibold">
          {match[2] || match[3]}
        </strong>
      );
    } else if (match[4]) {
      // Inline code
      parts.push(
        <code
          key={parts.length}
          className="rounded bg-foreground/10 px-1 py-0.5 text-[0.85em]"
        >
          {match[4]}
        </code>
      );
    } else if (match[5] || match[6]) {
      // Italic
      parts.push(
        <em key={parts.length}>{match[5] || match[6]}</em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function ChatMessage({
  role,
  content,
  rating,
  onRate,
  isStreaming,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3.5 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="text-sm leading-relaxed">
            {renderMarkdown(content)}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-foreground/70" />
            )}
          </div>
        )}

        {!isUser && !isStreaming && (
          <div className="mt-2 flex items-center gap-2 border-t border-foreground/5 pt-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="size-3 text-green-600" />
              ) : (
                <Copy className="size-3 text-muted-foreground" />
              )}
            </Button>

            {onRate && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-0.5 transition-colors"
                    onClick={() => onRate(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={cn(
                        "size-3.5 transition-colors",
                        (hoveredStar ? star <= hoveredStar : star <= (rating ?? 0))
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
