"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Schedule } from "@prisma/client";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type ScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Schedule | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
};

export function ScheduleDialog({
  open,
  onOpenChange,
  entry,
  onSave,
}: ScheduleDialogProps) {
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("lecture");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (entry) {
      setDayOfWeek(String(entry.dayOfWeek));
      setStartTime(entry.startTime);
      setEndTime(entry.endTime);
      setSubject(entry.subject);
      setLocation(entry.location ?? "");
      setType(entry.type ?? "lecture");
    } else {
      setDayOfWeek("1");
      setStartTime("08:00");
      setEndTime("10:00");
      setSubject("");
      setLocation("");
      setType("lecture");
    }
  }, [entry, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        subject,
        location: location || undefined,
        type,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {entry ? "Edit Schedule Entry" : "New Schedule Entry"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Day</Label>
            <Select value={dayOfWeek} onValueChange={(v) => v !== null && setDayOfWeek(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sched-subject">Subject</Label>
            <Input
              id="sched-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Science 101"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sched-location">Location</Label>
            <Input
              id="sched-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Room 204"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => v !== null && setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lecture">Lecture</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!subject || isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {entry ? "Save Changes" : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
