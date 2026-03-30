"use client";

import { useState } from "react";
import { Paperclip, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string;
  module: string;
  fileType: string;
}

interface ContentResponse {
  content: ContentItem[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

const fileTypeBadgeColors: Record<string, string> = {
  PDF: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  DOC: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DOCX: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PPT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  PPTX: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  VIDEO: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  IMAGE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function getFileTypeBadgeClass(fileType: string) {
  return fileTypeBadgeColors[fileType.toUpperCase()] ?? "bg-muted text-muted-foreground";
}

interface SourceDrawerProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function SourceDrawer({
  selectedIds,
  onSelectionChange,
}: SourceDrawerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<ContentResponse>({
    queryKey: ["source-content", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        pageSize: "20",
        page: String(page),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/content?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load content");
      return { content: json.data, pagination: json.pagination };
    },
    enabled: open,
  });

  const items = data?.content ?? [];
  const hasMore = data ? data.pagination.page < data.pagination.totalPages : false;

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((s) => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));

  const toggleAll = () => {
    if (allSelected) {
      const itemIds = new Set(items.map((i) => i.id));
      onSelectionChange(selectedIds.filter((id) => !itemIds.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...items.map((i) => i.id)]);
      onSelectionChange(Array.from(merged));
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" />
        }
      >
        <Paperclip data-icon="inline-start" />
        {selectedIds.length > 0 ? (
          <>
            <Badge variant="secondary" className="ml-1">
              {selectedIds.length}
            </Badge>
            <span className="sr-only">sources selected</span>
          </>
        ) : (
          "Sources"
        )}
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Select Sources</SheetTitle>
        </SheetHeader>

        <div className="px-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-4">
          <Button variant="ghost" size="xs" onClick={toggleAll}>
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No content found
            </p>
          )}

          <div className="space-y-1">
            {items.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted",
                  selectedIds.includes(item.id) && "bg-accent"
                )}
              >
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.module}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] font-medium uppercase",
                    getFileTypeBadgeClass(item.fileType)
                  )}
                >
                  {item.fileType}
                </span>
              </label>
            ))}
          </div>

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setPage((p) => p + 1)}
            >
              Load More
            </Button>
          )}
        </ScrollArea>

        <SheetFooter>
          <div className="flex w-full items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </p>
            <SheetClose
              render={<Button size="sm" />}
            >
              Done
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Sub-component: selected source chips displayed in the parent
interface SelectedSourceChipsProps {
  selectedIds: string[];
  onRemove: (id: string) => void;
}

export function SelectedSourceChips({
  selectedIds,
  onRemove,
}: SelectedSourceChipsProps) {
  const { data } = useQuery<ContentItem[]>({
    queryKey: ["source-titles", selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return [];
      const params = new URLSearchParams();
      selectedIds.forEach((id) => params.append("ids", id));
      const res = await fetch(`/api/content?${params}`);
      const json = await res.json();
      if (!res.ok) return [];
      return json.data ?? [];
    },
    enabled: selectedIds.length > 0,
  });

  if (selectedIds.length === 0) return null;

  const titleMap = new Map((data ?? []).map((item) => [item.id, item.title]));

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedIds.map((id) => (
        <Badge key={id} variant="secondary" className="gap-1 pr-1">
          <span className="max-w-32 truncate">
            {titleMap.get(id) ?? "Loading..."}
          </span>
          <button
            type="button"
            className="rounded-full p-0.5 transition-colors hover:bg-foreground/10"
            onClick={() => onRemove(id)}
            aria-label="Remove source"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
