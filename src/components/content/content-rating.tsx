"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";

type ContentRatingProps = {
  contentId: string;
  currentRating?: number | null;
  currentFeedback?: string | null;
};

export function ContentRating({
  contentId,
  currentRating,
  currentFeedback,
}: ContentRatingProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(currentRating ?? 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState(currentFeedback ?? "");
  const [showFeedback, setShowFeedback] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/content/${contentId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedbackText: feedback || undefined }),
      });
      if (!res.ok) throw new Error("Failed to rate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content", contentId] });
      setShowFeedback(false);
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground mr-2">Rate:</span>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setRating(value);
              setShowFeedback(true);
            }}
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5"
          >
            <Star
              className={`size-5 ${
                value <= (hoveredRating || rating)
                  ? "fill-yellow-500 text-yellow-500"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
      {showFeedback && (
        <div className="space-y-2">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Optional feedback..."
            rows={2}
          />
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || rating === 0}
          >
            {mutation.isPending && <Loader2 className="mr-2 size-3 animate-spin" />}
            Submit Rating
          </Button>
        </div>
      )}
    </div>
  );
}
