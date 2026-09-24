"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarClock,
  CheckCircle2,
  FileText,
  MessageSquare,
} from "lucide-react";
import type { StudentDashboardData } from "@/lib/dashboard/student-data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const badgeVariant = {
  "bg-r": "destructive",
  "bg-y": "secondary",
  "bg-b": "outline",
  "bg-g": "default",
} as const;

export function StudentDashboardClient({ data }: { data: StudentDashboardData }) {
  const [selectedTaskId, setSelectedTaskId] = useState(data.tasks[0]?.id ?? "");
  const selectedTask =
    data.tasks.find((task) => task.id === selectedTaskId) ?? data.tasks[0];

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Student workspace</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {data.studentName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.faculty} · Semester {data.semester}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/content"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <BookOpen className="size-4" aria-hidden="true" />
            Find materials
          </Link>
          <Link
            href="/ai"
            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            <Bot className="size-4" aria-hidden="true" />
            Ask AI
          </Link>
        </div>
      </header>

      <section aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="sr-only">Needs your attention</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            icon={MessageSquare}
            label="Unread messages"
            value={String(data.unreadMessages)}
            detail={data.unreadMessages === 1 ? "Message waiting" : "Messages waiting"}
            href="/messages"
          />
          <MetricCard
            icon={CalendarClock}
            label="Upcoming deadlines"
            value={String(data.upcomingDeadlines)}
            detail={
              data.nextDeadlineDays === null
                ? "Nothing due soon"
                : data.nextDeadlineDays <= 0
                  ? "Next task is due today"
                  : `Next task in ${data.nextDeadlineDays} day${data.nextDeadlineDays === 1 ? "" : "s"}`
            }
            href="/tasks"
          />
          <MetricCard
            icon={Bot}
            label="AI queries left"
            value={String(data.aiQueriesLeft)}
            detail={data.aiQueriesReset}
            href="/ai"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <Card>
          <CardHeader>
            <CardTitle>My courses</CardTitle>
            <CardDescription>Progress is based on materials you have opened.</CardDescription>
            <CardAction>
              <Link href="/content" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {data.activeCourses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No course materials yet"
                description="Materials published for your faculty and semester will appear here."
                href="/content"
                action="Browse materials"
              />
            ) : (
              <div className="space-y-4">
                {data.activeCourses.map((course) => (
                  <div key={`${course.name}-${course.semester}`} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="truncate font-medium">{course.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{course.progressPercent}%</span>
                    </div>
                    <Progress value={course.progressPercent} aria-label={`${course.name} progress`} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly progress</CardTitle>
            <CardDescription>Materials opened by teaching week.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.weekProgress.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Progress will appear after materials are published.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
                {data.weekProgress.map((item) => (
                  <div key={item.week} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Week {item.week}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">{item.progressPercent}%</p>
                    <Progress className="mt-2" value={item.progressPercent} aria-label={`Week ${item.week} progress`} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Your next five tasks, ordered by status and deadline.</CardDescription>
            <CardAction>
              <Link href="/tasks" className="text-sm font-medium text-primary hover:underline">Manage</Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {data.tasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="You are all caught up"
                description="Create a task when you need to remember an assignment or study goal."
                href="/tasks"
                action="Create a task"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-1" role="list" aria-label="Upcoming tasks">
                  {data.tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        task.id === selectedTask?.id && "bg-muted",
                      )}
                      aria-pressed={task.id === selectedTask?.id}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {task.avatar.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{task.title}</span>
                        <span className="block text-xs text-muted-foreground">{task.due}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {selectedTask ? (
                  <div className="rounded-lg border bg-muted/30 p-4" aria-live="polite">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-medium">{selectedTask.title}</h3>
                      <Badge variant={badgeVariant[selectedTask.badgeColor]}>{selectedTask.badge}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{selectedTask.description || "No description provided."}</p>
                    <p className="mt-4 text-xs font-medium text-muted-foreground">Due {selectedTask.due.toLowerCase()}</p>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent materials</CardTitle>
            <CardDescription>Latest resources for your faculty and semester.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentMaterials.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No materials available"
                description="New resources from your lecturers will appear here."
                href="/content"
                action="Open course materials"
              />
            ) : (
              <ul className="divide-y">
                {data.recentMaterials.map((material) => (
                  <li key={material.id}>
                    <Link href={`/content/${material.id}`} className="flex items-center gap-3 py-3 hover:text-primary">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                        <FileText className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{material.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{material.module} · Week {material.week}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  href,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} className="group rounded-xl bg-card p-4 ring-1 ring-foreground/10 hover:bg-muted/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed px-4 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      <Link href={href} className="mt-4 text-sm font-medium text-primary hover:underline">{action}</Link>
    </div>
  );
}
