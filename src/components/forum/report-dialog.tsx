"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Flag } from "lucide-react";

interface ReportDialogProps {
  postId: string;
}

export function ReportDialog({ postId }: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(() => setOpen(false), 1500);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSubmitted(false); setReason(""); } }}>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="sm" />}
        aria-label="Report post"
      >
        <Flag className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report this post</AlertDialogTitle>
          <AlertDialogDescription>
            This report will be reviewed by a moderator.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {submitted ? (
          <p className="py-4 text-sm text-muted-foreground">
            Report submitted. Thank you.
          </p>
        ) : (
          <div className="space-y-2 py-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you reporting this post?"
              maxLength={500}
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {!submitted && (
            <Button
              variant="destructive"
              onClick={handleReport}
              disabled={!reason.trim() || loading}
            >
              {loading && <Spinner className="mr-2 size-4" />}
              Submit Report
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
