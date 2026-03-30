"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAIStatus } from "@/hooks/use-ai";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

function formatCountdown(resetAt: string): string {
  const diff = new Date(resetAt).getTime() - Date.now();
  if (diff <= 0) return "0:00";
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Tick every second using useSyncExternalStore to avoid setState-in-effect
let tickListeners: (() => void)[] = [];
let tickInterval: ReturnType<typeof setInterval> | null = null;
let tickCount = 0;

function subscribeTick(callback: () => void) {
  tickListeners.push(callback);
  if (!tickInterval) {
    tickInterval = setInterval(() => {
      tickCount++;
      tickListeners.forEach((cb) => cb());
    }, 1_000);
  }
  return () => {
    tickListeners = tickListeners.filter((cb) => cb !== callback);
    if (tickListeners.length === 0 && tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  };
}

function getTickSnapshot() {
  return tickCount;
}

const MAX_FREE_QUERIES = 20;

export function QueryStatus() {
  const { data: status, isLoading } = useAIStatus();
  // Subscribe to tick to force re-render every second for countdown
  useSyncExternalStore(subscribeTick, getTickSnapshot, getTickSnapshot);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!status) return null;

  const hasFreeQueries = status.freeRemaining > 0;
  const countdown = status.resetAt ? formatCountdown(status.resetAt) : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-1.5 text-xs">
      <Sparkles className="size-3.5 shrink-0 text-primary" />

      {hasFreeQueries ? (
        <div className="flex flex-1 items-center gap-2">
          <span className="whitespace-nowrap text-muted-foreground">
            {status.freeRemaining} free {status.freeRemaining === 1 ? "query" : "queries"} left
          </span>
          <Progress
            value={(status.freeRemaining / MAX_FREE_QUERIES) * 100}
            className="h-1.5 w-16"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-muted-foreground">
            Tokens: <span className="font-medium text-foreground">{status.tokenBalance}</span>
          </span>
        </div>
      )}

      {countdown && (
        <span className="whitespace-nowrap font-mono text-muted-foreground">
          {countdown}
        </span>
      )}

      <Link
        href="/tokens"
        className="whitespace-nowrap text-primary hover:underline"
      >
        Get more
      </Link>
    </div>
  );
}
