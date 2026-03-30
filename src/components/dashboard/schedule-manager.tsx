"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ScheduleDialog } from "./schedule-dialog";
import type { Schedule } from "@prisma/client";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm

const typeColors: Record<string, string> = {
  lecture: "bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300",
  tutorial: "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300",
  lab: "bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300",
};

function timeToRow(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 7) * 2 + (m >= 30 ? 1 : 0);
}

function timeToSpan(start: string, end: string): number {
  return Math.max(timeToRow(end) - timeToRow(start), 1);
}

export function ScheduleManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Schedule | null>(null);

  const { data } = useQuery({
    queryKey: ["schedule"],
    queryFn: async () => {
      const res = await fetch("/api/schedule");
      if (!res.ok) throw new Error("Failed to fetch schedule");
      const json = await res.json();
      return json.data as Schedule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create entry");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await fetch(`/api/schedule/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update entry");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule"] }),
  });

  const entries = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Weekly Schedule</h2>
        <Button
          onClick={() => {
            setEditingEntry(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Add Entry
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <div
          className="grid min-w-[700px]"
          style={{
            gridTemplateColumns: "60px repeat(7, 1fr)",
            gridTemplateRows: `auto repeat(${HOURS.length * 2}, 24px)`,
          }}
        >
          {/* Header row */}
          <div className="border-b bg-muted/50 p-2" />
          {DAYS.map((day) => (
            <div
              key={day}
              className="border-b border-l bg-muted/50 p-2 text-center text-sm font-medium"
            >
              {day}
            </div>
          ))}

          {/* Time rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="border-t p-1 text-xs text-muted-foreground text-right pr-2"
              style={{ gridRow: `span 2` }}
            >
              {hour}:00
            </div>
          ))}

          {/* Day columns (empty grid cells) */}
          {DAYS.map((_, dayIdx) =>
            HOURS.map((hour) => (
              <div
                key={`${dayIdx}-${hour}`}
                className="border-l border-t"
                style={{
                  gridColumn: dayIdx + 2,
                  gridRow: `${(hour - 7) * 2 + 2} / span 2`,
                }}
              />
            ))
          )}

          {/* Schedule entries */}
          {entries.map((entry) => {
            const row = timeToRow(entry.startTime) + 2;
            const span = timeToSpan(entry.startTime, entry.endTime);
            const colorClass = typeColors[entry.type ?? "lecture"] ?? typeColors.lecture;

            return (
              <div
                key={entry.id}
                className={`relative mx-0.5 rounded border px-1.5 py-0.5 text-xs ${colorClass}`}
                style={{
                  gridColumn: entry.dayOfWeek + 2,
                  gridRow: `${row} / span ${span}`,
                  zIndex: 10,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{entry.subject}</div>
                    {entry.location && (
                      <div className="truncate opacity-70">{entry.location}</div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<button className="shrink-0 p-0.5 hover:bg-black/10 rounded" />}>
                      <MoreHorizontal className="size-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingEntry(entry);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(entry.id)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editingEntry}
        onSave={async (data) => {
          if (editingEntry) {
            await updateMutation.mutateAsync({ id: editingEntry.id, ...data });
          } else {
            await createMutation.mutateAsync(data);
          }
        }}
      />
    </div>
  );
}
