"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Bot, CheckSquare, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressData {
  quiz: {
    attempts: number;
    questionsAnswered: number;
    correct: number;
    accuracyPercent: number | null;
  };
  tasks: {
    completed: number;
    pending: number;
    completionPercent: number | null;
  };
  materials: {
    viewed: number;
    available: number;
    coveragePercent: number | null;
  };
  aiQueriesLast30Days: number;
  recentQuizzes: Array<{
    id: string;
    module: string;
    quizType: string;
    score: number;
    totalQuestions: number;
    createdAt: string;
  }>;
}

const QUIZ_TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple choice",
  true_false: "True / false",
  fill_blanks: "Fill in the blanks",
  matching: "Matching",
};

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  percent,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  detail: string;
  percent: number | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {percent !== null && (
          <Progress
            value={percent}
            aria-label={`${label}: ${percent}%`}
          />
        )}
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default function ProgressPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const res = await fetch("/api/progress");
      if (!res.ok) throw new Error("Failed to load progress");
      const json = await res.json();
      return json.data as ProgressData;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Your progress</h1>
        <p className="text-sm text-muted-foreground">
          Study activity across quizzes, tasks and course materials.
        </p>
      </header>

      {isError && (
        <Card role="alert">
          <CardContent className="py-6 text-sm text-destructive">
            We couldn&apos;t load your progress right now. Please refresh the page.
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Target}
              label="Quiz accuracy"
              value={
                data.quiz.accuracyPercent === null
                  ? "—"
                  : `${data.quiz.accuracyPercent}%`
              }
              percent={data.quiz.accuracyPercent}
              detail={
                data.quiz.attempts === 0
                  ? "No quizzes taken yet."
                  : `${data.quiz.correct} of ${data.quiz.questionsAnswered} correct across ${data.quiz.attempts} quizzes.`
              }
            />
            <StatCard
              icon={CheckSquare}
              label="Tasks completed"
              value={String(data.tasks.completed)}
              percent={data.tasks.completionPercent}
              detail={
                data.tasks.pending === 0
                  ? "Nothing outstanding."
                  : `${data.tasks.pending} still pending.`
              }
            />
            <StatCard
              icon={BookOpen}
              label="Materials opened"
              value={String(data.materials.viewed)}
              percent={data.materials.coveragePercent}
              detail={`of ${data.materials.available} available this semester.`}
            />
            <StatCard
              icon={Bot}
              label="AI sessions"
              value={String(data.aiQueriesLast30Days)}
              percent={null}
              detail="Questions asked in the last 30 days."
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent quizzes</CardTitle>
              <CardDescription>Your ten most recent attempts.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentQuizzes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  You haven&apos;t taken a quiz yet. Generate one from the AI
                  assistant to start tracking progress.
                </p>
              ) : (
                <ul className="divide-y">
                  {data.recentQuizzes.map((quiz) => {
                    const percent = Math.round(
                      (quiz.score / quiz.totalQuestions) * 100,
                    );
                    return (
                      <li
                        key={quiz.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{quiz.module}</p>
                          <p className="text-xs text-muted-foreground">
                            {QUIZ_TYPE_LABELS[quiz.quizType] ?? quiz.quizType} ·{" "}
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={percent >= 60 ? "default" : "secondary"}>
                          {quiz.score}/{quiz.totalQuestions} · {percent}%
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
