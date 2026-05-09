"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, BookOpen, Award, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ProgressData {
  module: string;
  completion: number;
  score: number;
}

interface PerformanceData {
  week: string;
  score: number;
}

export default function ProgressPage() {
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["student-progress"],
    queryFn: async () => {
      const res = await fetch("/api/student/progress");
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["student-performance"],
    queryFn: async () => {
      const res = await fetch("/api/student/performance");
      if (!res.ok) throw new Error("Failed to fetch performance");
      return res.json();
    },
  });

  const moduleProgress: ProgressData[] = progressData?.data?.modules ?? [];
  const weeklyPerformance: PerformanceData[] = performanceData?.data?.weekly ?? [];

  const stats = {
    overallProgress: progressData?.data?.overall ?? 0,
    tasksCompleted: progressData?.data?.tasksCompleted ?? 0,
    averageScore: performanceData?.data?.average ?? 0,
    coursesEnrolled: moduleProgress.length,
  };

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="size-8" />
          Learning Progress
        </h1>
        <p className="text-muted-foreground">
          Track your learning journey and academic performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overallProgress}%</div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <BookOpen className="size-4" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {stats.tasksCompleted}
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Award className="size-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {stats.averageScore.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Target className="size-4" />
              Courses Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {stats.coursesEnrolled}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Module Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress by Module</CardTitle>
            <CardDescription>
              {moduleProgress.length} module{moduleProgress.length !== 1 ? "s" : ""} tracked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProgress ? (
              <Skeleton className="h-64 w-full" />
            ) : moduleProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moduleProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="module" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completion" fill="#3b82f6" name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No module data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Performance</CardTitle>
            <CardDescription>Your scores over the last 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPerformance ? (
              <Skeleton className="h-64 w-full" />
            ) : weeklyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No performance data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Module Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Module Details</CardTitle>
          <CardDescription>Detailed progress for each module</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProgress ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : moduleProgress.length > 0 ? (
            <div className="space-y-3">
              {moduleProgress.map((module) => (
                <div
                  key={module.module}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{module.module}</h4>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 bg-muted rounded-full max-w-xs">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${module.completion}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {module.completion}%
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    Score: {module.score.toFixed(1)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No module progress data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
