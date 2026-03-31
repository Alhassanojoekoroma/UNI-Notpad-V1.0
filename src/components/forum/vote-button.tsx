"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

interface VoteButtonProps {
  postId: string;
  initialCount: number;
  initialVoted: boolean;
}

export function VoteButton({ postId, initialCount, initialVoted }: VoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleVote() {
    setLoading(true);
    // Optimistic update
    setVoted(!voted);
    setCount(voted ? count - 1 : count + 1);

    try {
      const res = await fetch(`/api/forum/${postId}/vote`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setVoted(data.data.voted);
        setCount(data.data.upvoteCount);
      } else {
        // Revert on failure
        setVoted(voted);
        setCount(count);
      }
    } catch {
      setVoted(voted);
      setCount(count);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={voted ? "default" : "outline"}
      size="sm"
      onClick={handleVote}
      disabled={loading}
      aria-label={voted ? "Remove upvote" : "Upvote"}
    >
      <ArrowUp className="size-4 mr-1" />
      {count}
    </Button>
  );
}
