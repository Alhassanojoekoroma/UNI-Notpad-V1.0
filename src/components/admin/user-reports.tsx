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

interface UserReport {
  id: string;
  reason: string;
  context: string | null;
  status: string;
  adminNotes: string | null;
  actionTaken: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reportedUser: { id: string; name: string | null; email: string | null } | null;
  reporter: { id: string; name: string | null; email: string | null } | null;
  reviewer: { id: string; name: string | null } | null;
}

export function UserReports() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("PENDING");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports?status=${activeTab}`);
      return res.json();
    },
  });

  const reports: UserReport[] = data?.data ?? [];

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
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No {activeTab.toLowerCase()} reports
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              queryClient={queryClient}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function ReportCard({
  report,
  queryClient,
}: {
  report: UserReport;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryClient: any;
}) {
  const [notes, setNotes] = useState(report.adminNotes ?? "");
  const [expanded, setExpanded] = useState(false);

  const resolve = useMutation({
    mutationFn: async (actionTaken: string) => {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          adminNotes: notes || undefined,
          actionTaken,
        }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              Report against {report.reportedUser?.name ?? report.reportedUser?.email ?? "Unknown"}
            </CardTitle>
            <CardDescription>
              Reported by {report.reporter?.name ?? report.reporter?.email ?? "Unknown"}{" "}
              {formatRelativeTime(new Date(report.createdAt))}
            </CardDescription>
          </div>
          <Badge variant={report.status === "PENDING" ? "destructive" : report.status === "REVIEWED" ? "secondary" : "outline"}>
            {report.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Reason:</p>
          <p className="text-sm text-muted-foreground">{report.reason}</p>
        </div>

        {report.context && (
          <div>
            <p className="text-sm font-medium">Context:</p>
            <p className="text-sm text-muted-foreground">{report.context}</p>
          </div>
        )}

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
            {report.status !== "RESOLVED" && (
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
                  onClick={() => resolve.mutate("WARN")}
                  disabled={resolve.isPending}
                >
                  Warn User
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolve.mutate("SUSPEND")}
                  disabled={resolve.isPending}
                >
                  Suspend
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => resolve.mutate("BAN")}
                  disabled={resolve.isPending}
                >
                  Ban Permanently
                </Button>
              </div>
            )}
          </>
        )}

        {!expanded && (
          <Button size="sm" variant="ghost" onClick={() => setExpanded(true)}>
            {report.status === "RESOLVED" ? "View Details" : "Review"}
          </Button>
        )}

        {report.actionTaken && (
          <p className="text-xs text-muted-foreground">
            Action taken: <Badge variant="outline" className="text-xs">{report.actionTaken}</Badge>
          </p>
        )}

        {report.reviewer && (
          <p className="text-xs text-muted-foreground">
            Reviewed by {report.reviewer.name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
