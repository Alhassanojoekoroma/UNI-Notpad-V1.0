"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";

interface CreatePostDialogProps {
  module: string;
  facultyId: string;
}

export function CreatePostDialog({ module, facultyId }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, facultyId, title, body }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setOpen(false);
        setTitle("");
        setBody("");
        queryClient.invalidateQueries({ queryKey: ["forum-posts", module] });
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4 mr-2" />
        New Post
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question or topic?"
              maxLength={300}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-body">Body</Label>
            <Textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Provide more details..."
              rows={6}
              maxLength={10000}
            />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !body.trim() || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending && <Spinner className="mr-2 size-4" />}
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
