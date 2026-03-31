"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { formatRelativeTime } from "@/lib/utils";

interface ContentFlag {
  id: string;
  reason: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  content: { id: string; title: string; status: string } | null;
  reporter: { id: string; name: string | null; email: string | null } | null;
  reviewer: { id: string; name: string | null } | null;
}

export function ContentFlags() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("PENDING");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-flags", activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/admin/flags?status=${activeTab}`);
      return res.json();
    },
  });

  const flags: ContentFlag[] = data?.data ?? [];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="PENDING">Pending</TabsTrigger>
        <TabsTrigger value="REVIEWED">Reviewed</TabsTrigger>
        <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="space-y-4 mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : flags.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No {activeTab.toLowerCase()} flags
            </CardContent>
          </Card>
        ) : (
          flags.map((flag) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              queryClient={queryClient}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function FlagCard({
  flag,
  queryClient,
}: {
  flag: ContentFlag;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryClient: any;
}) {
  const [notes, setNotes] = useState(flag.adminNotes ?? "");
  const [expanded, setExpanded] = useState(false);

  const resolve = useMutation({
    mutationFn: async (action: string) => {
      const res = await fetch(`/api/admin/flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          adminNotes: notes || undefined,
          action,
        }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-flags"] }),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {flag.content?.title ?? "Unknown Content"}
            </CardTitle>
            <CardDescription>
              Reported by {flag.reporter?.name ?? flag.reporter?.email ?? "Unknown"}{" "}
              {formatRelativeTime(new Date(flag.createdAt))}
            </CardDescription>
          </div>
          <Badge variant={flag.status === "PENDING" ? "destructive" : flag.status === "REVIEWED" ? "secondary" : "outline"}>
            {flag.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Reason:</p>
          <p className="text-sm text-muted-foreground">{flag.reason}</p>
        </div>

        {expanded && (
          <>
            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add resolution notes..."
                rows={2}
              />
            </div>
            {flag.status !== "RESOLVED" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolve.mutate("DISMISS")}
                  disabled={resolve.isPending}
                >
                  {resolve.isPending && <Spinner className="mr-1 size-3" />}
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolve.mutate("REMOVE_CONTENT")}
                  disabled={resolve.isPending}
                >
                  Remove Content
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolve.mutate("WARN_UPLOADER")}
                  disabled={resolve.isPending}
                >
                  Warn Uploader
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => resolve.mutate("SUSPEND_UPLOADER")}
                  disabled={resolve.isPending}
                >
                  Suspend Uploader
                </Button>
              </div>
            )}
          </>
        )}

        {!expanded && (
          <Button size="sm" variant="ghost" onClick={() => setExpanded(true)}>
            {flag.status === "RESOLVED" ? "View Details" : "Review"}
          </Button>
        )}

        {flag.reviewer && (
          <p className="text-xs text-muted-foreground">
            Reviewed by {flag.reviewer.name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
