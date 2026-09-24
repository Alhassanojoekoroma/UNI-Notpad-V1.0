"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins, Info, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TokensData {
  balance: { available: number; used: number; total: number; bonus: number };
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    createdAt: string;
  }>;
  freeQueries: {
    remaining: number;
    perDay: number;
    resetAt: string | null;
    cooldownHours: number;
  };
  purchaseAvailable: boolean;
}

export default function TokensPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tokens"],
    queryFn: async () => {
      const res = await fetch("/api/tokens");
      if (!res.ok) throw new Error("Failed to load tokens");
      const json = await res.json();
      return json.data as TokensData;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">AI tokens</h1>
        <p className="text-sm text-muted-foreground">
          Your free daily questions and token balance for the AI assistant.
        </p>
      </header>

      {isError && (
        <Card role="alert">
          <CardContent className="py-6 text-sm text-destructive">
            We couldn&apos;t load your balance right now. Please refresh the page.
          </CardContent>
        </Card>
      )}

      {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Sparkles className="size-4" aria-hidden="true" />
                  Free questions left today
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {data.freeQueries.remaining}
                  <span className="text-base font-normal text-muted-foreground">
                    {" / "}
                    {data.freeQueries.perDay}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {data.freeQueries.remaining > 0
                    ? `Resets ${data.freeQueries.cooldownHours} hours after you use your last one.`
                    : data.freeQueries.resetAt
                      ? `Resets ${new Date(data.freeQueries.resetAt).toLocaleString()}.`
                      : "Your allowance will reset shortly."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Coins className="size-4" aria-hidden="true" />
                  Token balance
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {data.balance.available}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {data.balance.used} used to date.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Honest about the gap rather than showing a button that cannot work.
              Payments are unimplemented — see docs/SYSTEM_AUDIT.md. */}
          {!data.purchaseAvailable && (
            <Card className="border-dashed">
              <CardContent className="flex gap-3 py-5">
                <Info
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="font-medium">Buying tokens isn&apos;t available yet</p>
                  <p className="text-sm text-muted-foreground">
                    Payment processing has not been set up on this instance. You
                    can keep using your free daily questions, and any tokens
                    granted by an administrator or through referrals will appear
                    here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data.transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No token activity yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {data.transactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium capitalize">
                          {tx.type.toLowerCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={tx.amount >= 0 ? "default" : "secondary"}>
                        {tx.amount >= 0 ? "+" : ""}
                        {tx.amount}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
