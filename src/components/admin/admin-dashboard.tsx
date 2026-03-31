"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  GraduationCap,
  BookOpen,
  Brain,
  Settings,
  Flag,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/lib/constants";

interface DashboardData {
  stats: {
    totalStudents: number;
    totalLecturers: number;
    totalAdmins: number;
    totalUsers: number;
    totalContent: number;
    totalAiInteractions: number;
  };
  recentRegistrations: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: string;
  }[];
  recentAiQueries: {
    id: string;
    queryType: string;
    createdAt: string;
    user: { name: string | null; email: string | null };
  }[];
}

export function AdminDashboard() {
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      return res.json();
    },
  });

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load dashboard data. Please try refreshing the page.
      </div>
    );
  }

  const stats = data?.data?.stats;
  const recentRegistrations = data?.data?.recentRegistrations ?? [];
  const recentAiQueries = data?.data?.recentAiQueries ?? [];

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users },
    { label: "Students", value: stats?.totalStudents, icon: GraduationCap },
    { label: "Content Items", value: stats?.totalContent, icon: BookOpen },
    { label: "AI Interactions", value: stats?.totalAiInteractions, icon: Brain },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.label}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{card.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Latest 10 user signups</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRegistrations.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{user.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] ?? user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(new Date(user.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentRegistrations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No registrations yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent AI Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent AI Queries</CardTitle>
            <CardDescription>Latest 10 AI interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAiQueries.map((query) => (
                    <TableRow key={query.id}>
                      <TableCell className="text-sm">
                        {query.user?.name ?? query.user?.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{query.queryType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(new Date(query.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentAiQueries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No AI queries yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/users" />}>
              <Users className="size-4 mr-2" /> User Management
            </Button>
            <Button variant="outline" render={<Link href="/analytics" />}>
              <BarChart3 className="size-4 mr-2" /> Analytics
            </Button>
            <Button variant="outline" render={<Link href="/settings" />}>
              <Settings className="size-4 mr-2" /> Settings
            </Button>
            <Button variant="outline" render={<Link href="/flags" />}>
              <Flag className="size-4 mr-2" /> Content Flags
            </Button>
            <Button variant="outline" render={<Link href="/reports" />}>
              <AlertTriangle className="size-4 mr-2" /> User Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
