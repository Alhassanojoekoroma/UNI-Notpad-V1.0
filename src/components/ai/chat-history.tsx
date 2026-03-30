"use client";

import { useState } from "react";
import { Plus, Trash2, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  useAIHistory,
  useDeleteConversation,
  useClearHistory,
} from "@/hooks/use-ai";
import type { AIConversation } from "@/lib/types";

interface ChatHistoryProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

function groupByDate(conversations: AIConversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000);

  const groups: { label: string; items: AIConversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt);
    if (date >= today) {
      groups[0].items.push(conv);
    } else if (date >= yesterday) {
      groups[1].items.push(conv);
    } else if (date >= weekAgo) {
      groups[2].items.push(conv);
    } else {
      groups[3].items.push(conv);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

export function ChatHistory({
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: ChatHistoryProps) {
  const { data: conversations = [], isLoading } = useAIHistory();
  const deleteConversation = useDeleteConversation();
  const clearHistory = useClearHistory();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groups = groupByDate(conversations);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onNewChat}
        >
          <Plus data-icon="inline-start" />
          New Chat
        </Button>

        {conversations.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Clear all conversations"
                />
              }
            >
              <Trash2 className="text-muted-foreground" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your chat history. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => clearHistory.mutate()}
                  disabled={clearHistory.isPending}
                >
                  {clearHistory.isPending ? "Clearing..." : "Clear All"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading && (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          )}

          {!isLoading && conversations.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="size-8 opacity-40" />
              <p>No conversations yet</p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((conv) => (
                <div
                  key={conv.conversationId}
                  className="group relative"
                >
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                      activeConversationId === conv.conversationId &&
                        "bg-accent text-accent-foreground"
                    )}
                    onClick={() => onSelectConversation(conv.conversationId)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {conv.title || conv.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(conv.updatedAt)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {conv.messageCount}
                    </Badge>
                  </button>

                  <AlertDialog
                    open={deletingId === conv.conversationId}
                    onOpenChange={(open) =>
                      setDeletingId(open ? conv.conversationId : null)
                    }
                  >
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="absolute top-2 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Delete conversation"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(conv.conversationId);
                          }}
                        />
                      }
                    >
                      <X className="text-muted-foreground" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This conversation will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => {
                            deleteConversation.mutate(conv.conversationId);
                            setDeletingId(null);
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
