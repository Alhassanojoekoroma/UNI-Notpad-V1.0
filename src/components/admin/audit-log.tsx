"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { formatRelativeTime } from "@/lib/utils";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string | null; email: string | null };
}

export function AuditLog() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("all");
  const [actionSearch, setActionSearch] = useState("");
  const debouncedAction = useDebounce(actionSearch, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-log", page, entityType, debouncedAction],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (entityType && entityType !== "all") params.set("entityType", entityType);
      if (debouncedAction) params.set("action", debouncedAction);
      const res = await fetch(`/api/admin/audit-log?${params}`);
      return res.json();
    },
  });

  const logs: AuditEntry[] = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={actionSearch}
            onChange={(e) => { setActionSearch(e.target.value); setPage(1); }}
            placeholder="Filter by action..."
            className="pl-9"
          />
        </div>
        <Select value={entityType} onValueChange={(v) => { setEntityType(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="flag">Flag</SelectItem>
            <SelectItem value="report">Report</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="program">Program</SelectItem>
            <SelectItem value="lecturer_code">Lecturer Code</SelectItem>
            <SelectItem value="message">Message</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(new Date(log.createdAt))}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user?.name ?? log.user?.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.entityType}/{log.entityId.slice(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No audit log entries
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages} ({pagination.total} entries)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
