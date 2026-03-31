"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle } from "lucide-react";

interface DeleteAccountDialogProps {
  pendingDeletion: boolean;
  onCancelled?: () => void;
}

export function DeleteAccountDialog({
  pendingDeletion,
  onCancelled,
}: DeleteAccountDialogProps) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to delete account");
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelDeletion() {
    setLoading(true);
    try {
      const res = await fetch("/api/users/me/cancel-deletion", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setOpen(false);
        onCancelled?.();
      }
    } catch {
      setError("Failed to cancel deletion");
    } finally {
      setLoading(false);
    }
  }

  if (pendingDeletion) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="size-5 text-destructive" />
          <p className="font-medium text-destructive">Account deletion pending</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Your account is scheduled for permanent deletion. You can cancel this
          within 7 days.
        </p>
        <Button
          variant="outline"
          onClick={handleCancelDeletion}
          disabled={loading}
        >
          {loading && <Spinner className="mr-2 size-4" />}
          Cancel Deletion
        </Button>
      </div>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Delete Account
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            Your account will be deactivated immediately and permanently deleted
            after 7 days. You can cancel within that period by logging in and
            visiting this page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="delete-reason">
              Reason for leaving (optional)
            </Label>
            <Textarea
              id="delete-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Help us improve..."
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-password">
              Confirm your password
            </Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!password || loading}
          >
            {loading && <Spinner className="mr-2 size-4" />}
            Delete My Account
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
