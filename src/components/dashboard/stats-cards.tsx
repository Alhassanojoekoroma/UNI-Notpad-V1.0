"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, Bot, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStats = {
  unreadMessages: number;
  upcomingDeadlines: number;
  freeQueriesRemaining: number;
};

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  const data = await res.json();
  return data.data;
}

const statItems = [
  { key: "unreadMessages" as const, label: "Unread Messages", icon: MessageSquare },
  { key: "upcomingDeadlines" as const, label: "Upcoming Deadlines", icon: Clock },
  { key: "freeQueriesRemaining" as const, label: "AI Queries Left", icon: Bot },
];

export function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {statItems.map((item) => (
          <Card key={item.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {statItems.map((item) => (
        <Card key={item.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
            <item.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.[item.key] ?? 0}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
