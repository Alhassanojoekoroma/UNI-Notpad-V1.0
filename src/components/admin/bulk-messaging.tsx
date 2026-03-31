"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Send } from "lucide-react";

interface Faculty {
  id: string;
  name: string;
}

export function BulkMessaging() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterRole, setFilterRole] = useState("");
  const [filterFacultyId, setFilterFacultyId] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: facultiesRes } = useQuery({
    queryKey: ["admin-faculties"],
    queryFn: async () => {
      const res = await fetch("/api/admin/faculties");
      return res.json();
    },
  });

  const faculties: Faculty[] = facultiesRes?.data ?? [];

  const buildFilter = () => {
    const filter: Record<string, unknown> = { type: filterType };
    if (filterType === "ROLE" && filterRole) filter.role = filterRole;
    if (filterType === "FACULTY" && filterFacultyId) filter.facultyId = filterFacultyId;
    if (filterType === "SEMESTER" && filterSemester) filter.semester = Number(filterSemester);
    return filter;
  };

  const preview = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          recipientFilter: buildFilter(),
          preview: true,
        }),
      });
      return res.json();
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          recipientFilter: buildFilter(),
        }),
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        setSent(true);
        setConfirmOpen(false);
      }
    },
  });

  const recipientCount = preview.data?.data?.recipientCount;

  const canSend = subject.trim() && body.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Bulk Message</CardTitle>
        <CardDescription>
          Send a message to multiple users at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-lg font-medium text-green-600">
              Message sent to {send.data?.data?.recipientCount ?? 0} users
            </p>
            <Button variant="outline" onClick={() => { setSent(false); setSubject(""); setBody(""); }}>
              Send Another
            </Button>
          </div>
        ) : (
          <>
            {/* Recipient filter */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Select value={filterType} onValueChange={(v) => { setFilterType(v ?? "ALL"); preview.reset(); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Users</SelectItem>
                  <SelectItem value="ROLE">By Role</SelectItem>
                  <SelectItem value="FACULTY">By Faculty</SelectItem>
                  <SelectItem value="SEMESTER">By Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "ROLE" && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={filterRole} onValueChange={(v) => setFilterRole(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Students</SelectItem>
                    <SelectItem value="LECTURER">Lecturers</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === "FACULTY" && (
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Select value={filterFacultyId} onValueChange={(v) => setFilterFacultyId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === "SEMESTER" && (
              <div className="space-y-2">
                <Label>Semester</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  placeholder="Semester number"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject"
              />
            </div>

            <div className="space-y-2">
              <Label>Message Body *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={6}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => preview.mutate()}
                disabled={!canSend || preview.isPending}
              >
                {preview.isPending && <Spinner className="mr-2 size-4" />}
                Preview
              </Button>

              {recipientCount !== undefined && (
                <p className="text-sm">
                  This will be sent to <strong>{recipientCount}</strong> users
                </p>
              )}
            </div>

            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!canSend}
            >
              <Send className="size-4 mr-2" /> Send Message
            </Button>
          </>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Send</AlertDialogTitle>
            <AlertDialogDescription>
              {recipientCount !== undefined
                ? `This message will be sent to ${recipientCount} users. This action cannot be undone.`
                : "Are you sure you want to send this message? Click Preview first to see the recipient count."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => send.mutate()} disabled={send.isPending}>
              {send.isPending && <Spinner className="mr-2 size-4" />}
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
