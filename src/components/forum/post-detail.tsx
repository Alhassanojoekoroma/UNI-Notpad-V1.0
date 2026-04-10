"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Pin } from "lucide-react";
import { VoteButton } from "./vote-button";
import { ReportDialog } from "./report-dialog";
import { ReplyForm } from "./reply-form";
import { useSession } from "@/hooks/use-session";

interface PostDetailProps {
  postId: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostDetail({ postId }: PostDetailProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["forum-post", postId],
    queryFn: async () => {
      const res = await fetch(`/api/forum/${postId}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (replyId: string) => {
      await fetch(`/api/forum/${replyId}/accept`, { method: "PATCH" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum-post", postId] }),
  });

  const pinMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/forum/${id}/pin`, { method: "PATCH" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum-post", postId] }),
  });

  if (isError) {
    return <p className="text-destructive">Failed to load post. Please try again.</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  const post = data?.data;
  if (!post) {
    return <p className="text-muted-foreground">Post not found.</p>;
  }

  const isOP = user?.id === post.authorId;

  const isLecturer =
    user?.role === "LECTURER" || user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Main post */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            {post.isPinned && <Pin className="size-4 text-primary" />}
            <h1 className="text-xl font-bold">{post.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Avatar className="size-6">
                <AvatarImage src={post.author.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {post.author.name?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{post.author.name ?? "Anonymous"}</span>
              {post.author.role === "LECTURER" && (
                <Badge variant="outline" className="text-[10px] py-0">
                  Lecturer
                </Badge>
              )}
            </div>
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <div className="prose prose-neutral dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
            {post.body}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <VoteButton
              postId={post.id}
              initialCount={post.upvoteCount}
              initialVoted={post.hasVoted}
            />
            <ReportDialog postId={post.id} />
            {isLecturer && !post.parentId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => pinMutation.mutate(post.id)}
              >
                <Pin className="size-4 mr-1" />
                {post.isPinned ? "Unpin" : "Pin"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {post.replies.length} {post.replies.length === 1 ? "Reply" : "Replies"}
        </h2>

        {post.replies.map((reply: {
          id: string;
          body: string;
          upvoteCount: number;
          isAcceptedAnswer: boolean;
          createdAt: string;
          authorId: string;
          hasVoted: boolean;
          author: { id: string; name: string | null; avatarUrl: string | null; role: string };
        }) => (
          <Card
            key={reply.id}
            className={reply.isAcceptedAnswer ? "border-green-500/50 bg-green-50/5" : ""}
          >
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Avatar className="size-5">
                    <AvatarImage src={reply.author.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {reply.author.name?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{reply.author.name ?? "Anonymous"}</span>
                  {reply.author.role === "LECTURER" && (
                    <Badge variant="outline" className="text-[10px] py-0">
                      Lecturer
                    </Badge>
                  )}
                </div>
                <span>{formatDate(reply.createdAt)}</span>
                {reply.isAcceptedAnswer && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="size-3 mr-1" />
                    Accepted
                  </Badge>
                )}
              </div>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {reply.body}
              </div>
              <div className="flex items-center gap-2">
                <VoteButton
                  postId={reply.id}
                  initialCount={reply.upvoteCount}
                  initialVoted={reply.hasVoted}
                />
                <ReportDialog postId={reply.id} />
                {isOP && !reply.isAcceptedAnswer && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acceptMutation.mutate(reply.id)}
                  >
                    <CheckCircle className="size-4 mr-1" />
                    Accept Answer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Reply form */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Your Reply</h3>
        <ReplyForm
          postId={post.id}
          module={post.module}
          facultyId={post.facultyId}
        />
      </div>
    </div>
  );
}
