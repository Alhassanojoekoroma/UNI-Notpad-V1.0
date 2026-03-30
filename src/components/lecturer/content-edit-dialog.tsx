"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { CONTENT_STATUS_LABELS } from "@/lib/constants";

interface ContentItem {
  id: string;
  title: string;
  module: string;
  description: string | null;
  tutorialLink: string | null;
  status: string;
}

interface ContentEditDialogProps {
  content: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentEditDialog({
  content,
  open,
  onOpenChange,
}: ContentEditDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: content?.title ?? "",
    module: content?.module ?? "",
    description: content?.description ?? "",
    tutorialLink: content?.tutorialLink ?? "",
    status: content?.status ?? "ACTIVE",
  });

  // Reset form when content changes
  if (content && formData.title !== content.title && open) {
    setFormData({
      title: content.title,
      module: content.module,
      description: content.description ?? "",
      tutorialLink: content.tutorialLink ?? "",
      status: content.status,
    });
  }

  const update = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/lecturer/content/${content?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          module: data.module,
          description: data.description || undefined,
          tutorialLink: data.tutorialLink || undefined,
          status: data.status,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecturer-content"] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-module">Module</Label>
            <Input
              id="edit-module"
              value={formData.module}
              onChange={(e) =>
                setFormData((p) => ({ ...p, module: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  description: e.target.value.slice(0, 500),
                }))
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-tutorialLink">Tutorial Link</Label>
            <Input
              id="edit-tutorialLink"
              type="url"
              value={formData.tutorialLink}
              onChange={(e) =>
                setFormData((p) => ({ ...p, tutorialLink: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => {
                if (v) setFormData((p) => ({ ...p, status: v }));
              }}
            >
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {update.error && (
            <p className="text-sm text-destructive">{update.error.message}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
