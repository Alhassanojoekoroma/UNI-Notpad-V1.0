"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Eye,
  Download,
  Star,
  Upload,
  FolderOpen,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface RecentContent {
  id: string;
  title: string;
  module: string;
  contentType: string;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

const quickActions = [
  { label: "Upload Content", href: "/upload", icon: Upload },
  { label: "Manage Content", href: "/content", icon: FolderOpen },
  { label: "View Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Send Message", href: "/messages", icon: MessageSquare },
];

export function LecturerDashboardStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["lecturer-stats"],
    queryFn: async () => {
      const res = await fetch("/api/lecturer/stats");
      return res.json();
    },
  });

  const stats = data?.data;

  const statCards = [
    {
      label: "Total Content",
      value: stats?.totalContent ?? 0,
      icon: FileText,
    },
    {
      label: "Total Views",
      value: stats?.totalViews ?? 0,
      icon: Eye,
    },
    {
      label: "Total Downloads",
      value: stats?.totalDownloads ?? 0,
      icon: Download,
    },
    {
      label: "Average Rating",
      value: stats?.averageRating ?? "-",
      icon: Star,
    },
  ];

  const recentContent: RecentContent[] = stats?.recentContent ?? [];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentContent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No content uploaded yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentContent.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.module} &middot;{" "}
                        {CONTENT_TYPE_LABELS[item.contentType as keyof typeof CONTENT_TYPE_LABELS]} &middot;{" "}
                        {formatDate(new Date(item.createdAt))}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {item.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="size-3" />
                        {item.downloadCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Button
                  key={action.href}
                  variant="outline"
                  className="justify-start"
                  render={<Link href={action.href} />}
                >
                  <action.icon className="mr-2 size-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
