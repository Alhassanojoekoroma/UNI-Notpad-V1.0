"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Archive, Eye, Download, Star } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentEditDialog } from "./content-edit-dialog";
import { CONTENT_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string;
  module: string;
  moduleCode: string | null;
  contentType: string;
  status: string;
  viewCount: number;
  downloadCount: number;
  averageRating: number | null;
  version: number;
  description: string | null;
  tutorialLink: string | null;
  createdAt: string;
  faculty: { name: string };
  program: { name: string } | null;
}

const statusColors: Record<string, string> = {
  ACTIVE: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

export function ContentTable() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [editContent, setEditContent] = useState<ContentItem | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["lecturer-content", status, debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (status !== "ALL") params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/lecturer/content?${params}`);
      return res.json();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lecturer/content/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecturer-content"] });
      setArchiveId(null);
    },
  });

  const content: ContentItem[] = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
            <TabsTrigger value="DRAFT">Draft</TabsTrigger>
            <TabsTrigger value="ARCHIVED">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search by title or module..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="sm:max-w-xs"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Module</TableHead>
              <TableHead className="hidden lg:table-cell">Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right">
                <Eye className="inline size-4" />
              </TableHead>
              <TableHead className="hidden sm:table-cell text-right">
                <Download className="inline size-4" />
              </TableHead>
              <TableHead className="hidden lg:table-cell text-right">
                <Star className="inline size-4" />
              </TableHead>
              <TableHead className="hidden xl:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No content found
                </TableCell>
              </TableRow>
            ) : (
              content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>
                      {item.title}
                      {item.version > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          v{item.version}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.module}
                    {item.moduleCode && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({item.moduleCode})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {CONTENT_TYPE_LABELS[item.contentType as keyof typeof CONTENT_TYPE_LABELS] ?? item.contentType}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[item.status] as "default" | "secondary" | "outline"}>
                      {CONTENT_STATUS_LABELS[item.status as keyof typeof CONTENT_STATUS_LABELS] ?? item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {item.viewCount}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {item.downloadCount}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right">
                    {item.averageRating?.toFixed(1) ?? "-"}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                    {formatDate(new Date(item.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditContent(item)}
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {item.status !== "ARCHIVED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setArchiveId(item.id)}
                          title="Archive"
                        >
                          <Archive className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {content.length} of {pagination.total} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ContentEditDialog
        content={editContent}
        open={!!editContent}
        onOpenChange={(open) => {
          if (!open) setEditContent(null);
        }}
      />

      <AlertDialog
        open={!!archiveId}
        onOpenChange={(open) => {
          if (!open) setArchiveId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this content?</AlertDialogTitle>
            <AlertDialogDescription>
              Students will no longer be able to see this content. You can change
              the status back to Active later from the edit dialog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveId && archiveMutation.mutate(archiveId)}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
