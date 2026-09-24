"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportDataCard } from "@/components/settings/export-data-card";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";

export default function LecturerSettingsPage() {
  const { user, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name ?? "");

  const { data: profileData, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      return res.json();
    },
  });

  const profile = profileData?.data;
  const displayName = name || profile?.name || user?.name || "";

  const updateProfile = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      updateSession();
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      updateProfile.mutate({ name: displayName.trim() });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and account preferences
        </p>
      </div>

      {isError && (
        <Card role="alert">
          <CardContent className="py-6 text-sm text-destructive">
            We couldn&apos;t load your profile. Refresh the page and try again.
          </CardContent>
        </Card>
      )}

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email ?? user?.email ?? ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            {updateProfile.error && (
              <p className="text-sm text-destructive">
                {updateProfile.error.message}
              </p>
            )}
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ExportDataCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Deactivate your account and schedule its data for deletion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog
            pendingDeletion={!!profile?.deletedAt}
            hasPassword={profile?.hasPassword ?? true}
            onCancelled={() =>
              queryClient.invalidateQueries({ queryKey: ["profile"] })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
