"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, MessageSquare, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  moduleCode: string;
  moduleName: string;
  memberCount: number;
  topic: string;
  isMember: boolean;
  createdAt: string;
}

export default function StudyGroupsPage() {
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupTopic, setNewGroupTopic] = useState("");
  const [selectedModule, setSelectedModule] = useState("");

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ["study-groups"],
    queryFn: async () => {
      const res = await fetch("/api/student/study-groups");
      if (!res.ok) throw new Error("Failed to fetch study groups");
      return res.json();
    },
  });

  const createGroup = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/student/study-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupTopic("");
    },
  });

  const joinGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const res = await fetch(`/api/student/study-groups/${groupId}/join`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to join group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
    },
  });

  const groups: StudyGroup[] = groupsData?.data ?? [];
  const myGroups = groups.filter((g) => g.isMember);
  const availableGroups = groups.filter((g) => !g.isMember);

  const handleCreateGroup = async () => {
    if (newGroupName && selectedModule) {
      await createGroup.mutateAsync({
        name: newGroupName,
        description: newGroupDescription,
        topic: newGroupTopic,
        moduleCode: selectedModule,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="size-8" />
          Study Groups
        </h1>
        <p className="text-muted-foreground">
          Collaborate with peers in topic-specific study groups
        </p>
      </div>

      {/* Create Group Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 size-4" />
            Create Study Group
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Study Group</DialogTitle>
            <DialogDescription>
              Start a study group to collaborate with peers on course topics
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Data Structures Study Group"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-topic">Topic *</Label>
              <Input
                id="group-topic"
                value={newGroupTopic}
                onChange={(e) => setNewGroupTopic(e.target.value)}
                placeholder="e.g., Tree Algorithms"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Brief description of what this group focuses on..."
                rows={3}
              />
            </div>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName || !selectedModule || createGroup.isPending}
              className="w-full"
            >
              {createGroup.isPending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Study Groups */}
      {myGroups.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">My Study Groups</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {myGroups.map((group) => (
              <Card key={group.id} className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>
                        {group.moduleCode} • {group.moduleName}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Member</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Topic</p>
                    <p className="text-sm text-muted-foreground">{group.topic}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {group.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="size-4" />
                      <span>{group.memberCount} members</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="mr-2 size-4" />
                      Messages
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Study Groups */}
      {availableGroups.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            Available Groups ({availableGroups.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {availableGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription>
                      {group.moduleCode} • {group.moduleName}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Topic</p>
                    <p className="text-sm text-muted-foreground">{group.topic}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {group.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="size-4" />
                      <span>{group.memberCount} members</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => joinGroup.mutate(group.id)}
                      disabled={joinGroup.isPending}
                    >
                      {joinGroup.isPending ? (
                        <Spinner className="size-4" />
                      ) : (
                        <>
                          Join
                          <ArrowRight className="ml-2 size-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {groups.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 size-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No study groups available yet. Create one to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
