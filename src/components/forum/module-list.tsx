"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagesSquare } from "lucide-react";

interface ModuleData {
  module: string;
  postCount: number;
}

export function ModuleList() {
  const { data, isLoading } = useQuery({
    queryKey: ["forum-modules"],
    queryFn: async () => {
      const res = await fetch("/api/forum");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const modules: ModuleData[] = data?.data ?? [];

  if (modules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessagesSquare className="size-12 mx-auto mb-4 opacity-50" />
        <p>No forum posts yet. Be the first to start a discussion!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((m) => (
        <Link key={m.module} href={`/forum/${encodeURIComponent(m.module)}`}>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{m.module}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">
                {m.postCount} {m.postCount === 1 ? "post" : "posts"}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
