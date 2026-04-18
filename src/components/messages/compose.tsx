"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

type ComposeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    recipientId: string;
    recipientName: string;
    subject: string;
  } | null;
};

type UserResult = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

export function ComposeDialog({ open, onOpenChange, replyTo }: ComposeDialogProps) {
  const queryClient = useQueryClient();
  const [recipientId, setRecipientId] = useState(replyTo?.recipientId ?? "");
  const [recipientName, setRecipientName] = useState(replyTo?.recipientName ?? "");
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : "");
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: users } = useQuery({
    queryKey: ["user-search", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return [];
      const res = await fetch(`/api/users?search=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data as UserResult[];
    },
    enabled: debouncedSearch.length >= 2,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, subject, body }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      onOpenChange(false);
      setRecipientId("");
      setRecipientName("");
      setSubject("");
      setBody("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>To</Label>
            {recipientId ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">{recipientName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRecipientId("");
                    setRecipientName("");
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger
                  nativeButton={false}
                  render={
                    <Input
                      placeholder="Search for a user..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setSearchQuery(e.target.value);
                        setPopoverOpen(true);
                      }}
                      onFocus={() => setPopoverOpen(true)}
                    />
                  }
                />
                <PopoverContent className="p-0 w-(--anchor-width)" align="start">
                  <Command>
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {(users ?? []).map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => {
                              setRecipientId(user.id);
                              setRecipientName(user.name ?? user.email ?? "");
                              setSearchQuery("");
                              setPopoverOpen(false);
                            }}
                          >
                            <span>{user.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {user.role}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg-subject">Subject</Label>
            <Input
              id="msg-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg-body">Message</Label>
            <Textarea
              id="msg-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={
              !recipientId || !subject || !body || sendMutation.isPending
            }
          >
            {sendMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
