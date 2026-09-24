"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Gift, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralsData {
  referralCode: string | null;
  bonusTokensPerReferral: number;
  totalReferrals: number;
  totalTokensAwarded: number;
  referrals: Array<{
    id: string;
    status: string;
    tokensAwarded: number;
    createdAt: string;
    refereeName: string;
  }>;
}

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const res = await fetch("/api/referrals");
      if (!res.ok) throw new Error("Failed to load referrals");
      const json = await res.json();
      return json.data as ReferralsData;
    },
  });

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the code stays visible for manual copy.
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="text-sm text-muted-foreground">
          Invite classmates with your code. They enter it when they register.
        </p>
      </header>

      {isError && (
        <Card role="alert">
          <CardContent className="py-6 text-sm text-destructive">
            We couldn&apos;t load your referrals right now. Please refresh the page.
          </CardContent>
        </Card>
      )}

      {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your referral code</CardTitle>
              <CardDescription>
                {data.bonusTokensPerReferral > 0
                  ? `Earn ${data.bonusTokensPerReferral} AI tokens for each classmate who joins.`
                  : "Share this code with classmates joining UniNotepad."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.referralCode ? (
                <div className="flex flex-wrap items-center gap-3">
                  <code className="rounded-md bg-muted px-4 py-2 font-mono text-lg tracking-widest">
                    {data.referralCode}
                  </code>
                  <Button
                    variant="outline"
                    onClick={() => copyCode(data.referralCode!)}
                  >
                    {copied ? (
                      <Check className="mr-2 size-4" aria-hidden="true" />
                    ) : (
                      <Copy className="mr-2 size-4" aria-hidden="true" />
                    )}
                    {copied ? "Copied" : "Copy code"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No referral code has been issued for your account.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="size-4" aria-hidden="true" />
                  Classmates referred
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {data.totalReferrals}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Gift className="size-4" aria-hidden="true" />
                  Tokens earned
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {data.totalTokensAwarded}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Referral history</CardTitle>
            </CardHeader>
            <CardContent>
              {data.referrals.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No referrals yet. Share your code to get started.
                </p>
              ) : (
                <ul className="divide-y">
                  {data.referrals.map((referral) => (
                    <li
                      key={referral.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {referral.refereeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined{" "}
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          referral.status === "completed" ? "default" : "secondary"
                        }
                      >
                        {referral.status === "completed"
                          ? `+${referral.tokensAwarded} tokens`
                          : "Pending"}
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
