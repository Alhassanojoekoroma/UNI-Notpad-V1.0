"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pen, MoreHorizontal, Reply, Ban, Flag } from "lucide-react";
import { ComposeDialog } from "./compose";
import { formatRelativeTime } from "@/lib/utils";

type MessageItem = {
  id: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; name: string | null; avatarUrl: string | null };
  recipient?: { id: string; name: string | null; avatarUrl: string | null };
};

export function MessageInbox() {
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    recipientId: string;
    recipientName: string;
    subject: string;
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const inboxQuery = useQuery({
    queryKey: ["messages", "inbox"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const sentQuery = useQuery({
    queryKey: ["messages", "sent"],
    queryFn: async () => {
      const res = await fetch("/api/messages/sent");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/messages/${id}/read`, { method: "PATCH" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages"] }),
  });

  const blockMutation = useMutation({
    mutationFn: async (userId: string) => {
      await fetch(`/api/users/${userId}/block`, { method: "POST" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages"] }),
  });

  function handleExpand(msg: MessageItem) {
    setExpandedId(expandedId === msg.id ? null : msg.id);
    if (!msg.isRead) {
      markReadMutation.mutate(msg.id);
    }
  }

  const inboxMessages: MessageItem[] = inboxQuery.data?.data ?? [];
  const sentMessages: MessageItem[] = sentQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Button onClick={() => { setReplyTo(null); setComposeOpen(true); }}>
          <Pen className="mr-2 size-4" />
          Compose
        </Button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">
            Inbox
            {inboxMessages.filter((m) => !m.isRead).length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {inboxMessages.filter((m) => !m.isRead).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-1">
          {inboxQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : inboxMessages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No messages yet.</p>
          ) : (
            inboxMessages.map((msg) => (
              <div key={msg.id} className="rounded-lg border">
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 p-3 text-left ${
                    !msg.isRead ? "bg-primary/5 font-medium" : ""
                  }`}
                  onClick={() => handleExpand(msg)}
                >
                  {!msg.isRead && (
                    <div className="size-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">
                        {msg.sender?.name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm truncate">{msg.subject}</div>
                  </div>
                </button>
                {expandedId === msg.id && (
                  <div className="border-t p-3 space-y-3">
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyTo({
                            recipientId: msg.sender!.id,
                            recipientName: msg.sender!.name ?? "",
                            subject: msg.subject,
                          });
                          setComposeOpen(true);
                        }}
                      >
                        <Reply className="mr-1 size-3" />
                        Reply
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button size="sm" variant="ghost" />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              msg.sender && blockMutation.mutate(msg.sender.id)
                            }
                          >
                            <Ban className="mr-2 size-4" />
                            Block Sender
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Flag className="mr-2 size-4" />
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-1">
          {sentQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : sentMessages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No sent messages.</p>
          ) : (
            sentMessages.map((msg) => (
              <div key={msg.id} className="rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-3 text-left"
                  onClick={() =>
                    setExpandedId(expandedId === msg.id ? null : msg.id)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">
                        To: {msg.recipient?.name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm truncate">{msg.subject}</div>
                  </div>
                </button>
                {expandedId === msg.id && (
                  <div className="border-t p-3">
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        replyTo={replyTo}
      />
    </div>
  );
}
