"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

interface ReplyFormProps {
  postId: string;
  module: string;
  facultyId: string;
}

export function ReplyForm({ postId, module, facultyId }: ReplyFormProps) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, facultyId, body, parentId: postId }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setBody("");
        queryClient.invalidateQueries({ queryKey: ["forum-post", postId] });
      }
    },
  });

  return (
    <div className="space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply..."
        rows={3}
        maxLength={10000}
      />
      <Button
        size="sm"
        onClick={() => replyMutation.mutate()}
        disabled={!body.trim() || replyMutation.isPending}
      >
        {replyMutation.isPending && <Spinner className="mr-2 size-4" />}
        Reply
      </Button>
    </div>
  );
}
