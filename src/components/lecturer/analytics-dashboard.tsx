"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Eye,
  Download,
  ArrowUpDown,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatRelativeTime } from "@/lib/utils";

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#94a3b8",
  "#f97316",
];

type SortKey = "viewCount" | "downloadCount" | "averageRating";

interface ContentStat {
  id: string;
  title: string;
  module: string;
  contentType: string;
  viewCount: number;
  downloadCount: number;
  averageRating: number | null;
  createdAt: string;
}

export function AnalyticsDashboard() {
  const [sortKey, setSortKey] = useState<SortKey>("viewCount");
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["lecturer-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/lecturer/analytics");
      return res.json();
    },
  });

  const analytics = data?.data;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedContent: ContentStat[] = analytics?.allContent
    ? [...analytics.allContent].sort((a: ContentStat, b: ContentStat) => {
        const aVal = a[sortKey] ?? 0;
        const bVal = b[sortKey] ?? 0;
        return sortAsc
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      })
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!analytics) return null;

  const maxViews = Math.max(
    ...analytics.topContent.map((c: { viewCount: number }) => c.viewCount),
    1
  );

  const pieData = analytics.typeBreakdown.map(
    (t: { type: string; count: number }) => ({
      name: CONTENT_TYPE_LABELS[t.type as keyof typeof CONTENT_TYPE_LABELS] ?? t.type,
      value: t.count,
    })
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Content
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalContent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalViews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Downloads
            </CardTitle>
            <Download className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalDownloads}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most viewed content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Viewed Content</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topContent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topContent.map(
                  (item: {
                    id: string;
                    title: string;
                    viewCount: number;
                  }) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">
                          {item.title}
                        </span>
                        <span className="ml-2 shrink-0 text-muted-foreground">
                          {item.viewCount} views
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{
                            width: `${(item.viewCount / maxViews) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent downloads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentDownloads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No downloads yet</p>
            ) : (
              <div className="space-y-2">
                {analytics.recentDownloads.map(
                  (d: {
                    id: string;
                    contentTitle: string;
                    userName: string;
                    createdAt: string;
                  }) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-lg border p-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {d.contentTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {d.userName}
                        </p>
                      </div>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(d.createdAt))}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content type breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) =>
                      `${name ?? ""} (${value})`
                    }
                  >
                    {pieData.map(
                      (_: { name: string; value: number }, i: number) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Views over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.viewsOverTime.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    fontSize={12}
                  />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip
                    labelFormatter={(v) =>
                      `Week of ${formatDate(new Date(String(v)))}`
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full stats table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Content Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Module</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort("viewCount")}
                    >
                      Views
                      <ArrowUpDown className="ml-1 size-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort("downloadCount")}
                    >
                      Downloads
                      <ArrowUpDown className="ml-1 size-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort("averageRating")}
                    >
                      Rating
                      <ArrowUpDown className="ml-1 size-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedContent.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No content yet
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedContent.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.module}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {CONTENT_TYPE_LABELS[item.contentType as keyof typeof CONTENT_TYPE_LABELS] ?? item.contentType}
                      </TableCell>
                      <TableCell>{item.viewCount}</TableCell>
                      <TableCell>{item.downloadCount}</TableCell>
                      <TableCell>
                        {item.averageRating?.toFixed(1) ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
