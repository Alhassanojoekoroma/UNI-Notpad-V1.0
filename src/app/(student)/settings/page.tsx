"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ExportDataCard } from "@/components/settings/export-data-card";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";

export default function StudentSettingsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      return res.json();
    },
  });

  const profile = profileRes?.data;

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // Initialize name field when profile loads
  const displayName = name || profile?.name || "";

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="data-privacy">Data & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your display name and profile settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email ?? ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <Button
                onClick={() => updateMutation.mutate({ name: displayName })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Spinner className="mr-2 size-4" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-privacy" className="space-y-6 mt-6">
          <ExportDataCard />

          <Card>
            <CardHeader>
              <CardTitle>Legal</CardTitle>
              <CardDescription>
                Review our policies and legal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="link"
                className="px-0"
                render={<Link href="/terms" target="_blank" />}
              >
                Terms of Service
              </Button>
              <Button
                variant="link"
                className="px-0"
                render={<Link href="/privacy" target="_blank" />}
              >
                Privacy Policy
              </Button>
              <Button
                variant="link"
                className="px-0"
                render={<Link href="/conduct" target="_blank" />}
              >
                Code of Conduct
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteAccountDialog
                pendingDeletion={!!profile?.deletedAt}
                onCancelled={() =>
                  queryClient.invalidateQueries({ queryKey: ["profile"] })
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
