"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowUp,
  MessageSquare,
  CheckCircle,
  Pin,
  MessagesSquare,
} from "lucide-react";
import { useState } from "react";

interface PostAuthor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
}

interface PostItem {
  id: string;
  module: string;
  title: string | null;
  body: string;
  isPinned: boolean;
  upvoteCount: number;
  isAcceptedAnswer: boolean;
  createdAt: string;
  author: PostAuthor;
  hasVoted: boolean;
  replyCount: number;
}

interface PostListProps {
  module: string;
}

function formatDate(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function PostList({ module }: PostListProps) {
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["forum-posts", module, sort, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/forum?module=${encodeURIComponent(module)}&sort=${sort}&page=${page}`
      );
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const posts: PostItem[] = data?.data ?? [];
  const pagination = data?.pagination;

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessagesSquare className="size-12 mx-auto mb-4 opacity-50" />
        <p>No posts in this module yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={sort === "newest" ? "default" : "outline"}
          size="sm"
          onClick={() => { setSort("newest"); setPage(1); }}
        >
          Newest
        </Button>
        <Button
          variant={sort === "popular" ? "default" : "outline"}
          size="sm"
          onClick={() => { setSort("popular"); setPage(1); }}
        >
          Popular
        </Button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/forum/${encodeURIComponent(module)}/${post.id}`}
          >
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground min-w-[3rem]">
                  <ArrowUp className={`size-4 ${post.hasVoted ? "text-primary" : ""}`} />
                  <span>{post.upvoteCount}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {post.isPinned && (
                      <Pin className="size-3.5 text-primary" />
                    )}
                    <h3 className="font-medium truncate">
                      {post.title ?? "Untitled"}
                    </h3>
                    {post.isAcceptedAnswer && (
                      <CheckCircle className="size-4 text-green-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="size-5">
                        <AvatarImage src={post.author.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {post.author.name?.[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{post.author.name ?? "Anonymous"}</span>
                      {post.author.role === "LECTURER" && (
                        <Badge variant="outline" className="text-[10px] py-0">
                          Lecturer
                        </Badge>
                      )}
                    </div>
                    <span>{formatDate(post.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="size-3.5" />
                      <span>{post.replyCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-3">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
