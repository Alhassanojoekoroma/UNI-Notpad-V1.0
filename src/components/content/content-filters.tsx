"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import type { ContentType } from "@prisma/client";

type ContentFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  contentType: string;
  onContentTypeChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
};

export function ContentFilters({
  search,
  onSearchChange,
  contentType,
  onContentTypeChange,
  sort,
  onSortChange,
}: ContentFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title or module..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={contentType} onValueChange={(v) => v !== null && onContentTypeChange(v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={(v) => v !== null && onSortChange(v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="views">Most Viewed</SelectItem>
          <SelectItem value="downloads">Most Downloaded</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
