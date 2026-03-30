"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ContentCard } from "./content-card";
import { ContentFilters } from "./content-filters";
import { useDebounce } from "@/hooks/use-debounce";

type ContentItem = {
  id: string;
  title: string;
  module: string;
  fileType: string;
  contentType: string;
  viewCount: number;
  downloadCount: number;
  averageRating: number | null;
  lecturer: { name: string | null };
};

export function ContentGrid() {
  const [search, setSearch] = useState("");
  const [contentType, setContentType] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["content", debouncedSearch, contentType, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (contentType !== "all") params.set("contentType", contentType);
      params.set("sort", sort);
      params.set("page", String(page));
      const res = await fetch(`/api/content?${params}`);
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
  });

  const items: ContentItem[] = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <ContentFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        contentType={contentType}
        onContentTypeChange={(v) => {
          setContentType(v);
          setPage(1);
        }}
        sort={sort}
        onSortChange={(v) => {
          setSort(v);
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading materials...
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No materials found for your faculty and semester.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ContentCard
                key={item.id}
                id={item.id}
                title={item.title}
                module={item.module}
                lecturerName={item.lecturer.name}
                fileType={item.fileType}
                contentType={item.contentType}
                viewCount={item.viewCount}
                downloadCount={item.downloadCount}
                averageRating={item.averageRating}
              />
            ))}
          </div>
          {pagination && page < pagination.totalPages && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
