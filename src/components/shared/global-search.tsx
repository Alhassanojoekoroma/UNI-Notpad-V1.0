"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Search,
  BookOpen,
  CheckSquare,
  Calendar,
  MessageSquare,
  MessagesSquare,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import type { SearchResults } from "@/lib/types";

const categoryIcons = {
  content: BookOpen,
  tasks: CheckSquare,
  schedule: Calendar,
  messages: MessageSquare,
  forum: MessagesSquare,
};

const categoryLabels = {
  content: "Course Materials",
  tasks: "Tasks",
  schedule: "Schedule",
  messages: "Messages",
  forum: "Forum",
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Cmd+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const { data } = useQuery({
    queryKey: ["search", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return null;
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedSearch)}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json.data as SearchResults;
    },
    enabled: debouncedSearch.length >= 2,
  });

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setSearch("");
      router.push(href);
    },
    [router]
  );

  const categories = data
    ? (Object.keys(data) as Array<keyof SearchResults>).filter(
        (cat) => data[cat].length > 0
      )
    : [];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="sr-only">Search (Cmd+K)</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search materials, tasks, messages..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {debouncedSearch.length < 2
              ? "Type at least 2 characters to search..."
              : "No results found."}
          </CommandEmpty>
          {categories.map((category) => {
            const Icon = categoryIcons[category];
            return (
              <CommandGroup
                key={category}
                heading={categoryLabels[category]}
              >
                {data![category].map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <Icon className="mr-2 size-4" />
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
