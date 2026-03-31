"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Check } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface LecturerCode {
  id: string;
  lecturerName: string;
  isActive: boolean;
  createdAt: string;
  revokedAt: string | null;
  faculty: { name: string } | null;
}

interface Faculty {
  id: string;
  name: string;
}

export function LecturerCodes() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lecturerName, setLecturerName] = useState("");
  const [facultyId, setFacultyId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lecturer-codes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/lecturer-codes");
      return res.json();
    },
  });

  const { data: facultiesRes } = useQuery({
    queryKey: ["admin-faculties"],
    queryFn: async () => {
      const res = await fetch("/api/admin/faculties");
      return res.json();
    },
  });

  const createCode = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/lecturer-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lecturerName,
          facultyId: facultyId || undefined,
        }),
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        setGeneratedCode(result.data.plainCode);
        queryClient.invalidateQueries({ queryKey: ["admin-lecturer-codes"] });
      }
    },
  });

  const revokeCode = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/lecturer-codes/${id}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lecturer-codes"] });
      setRevokeId(null);
    },
  });

  const codes: LecturerCode[] = data?.data ?? [];
  const faculties: Faculty[] = facultiesRes?.data ?? [];

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setGeneratedCode(null);
    setLecturerName("");
    setFacultyId("");
    setCopied(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setDialogOpen(true); }}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4 mr-2" /> Generate New Code
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {generatedCode ? "Code Generated" : "Generate Lecturer Code"}
              </DialogTitle>
            </DialogHeader>
            {generatedCode ? (
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  This code will only be shown once. Make sure to copy it now.
                </p>
                <div className="flex items-center gap-2">
                  <Input value={generatedCode} readOnly className="font-mono text-lg" />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <Button onClick={handleCloseDialog} className="w-full">Done</Button>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Lecturer Name *</Label>
                  <Input
                    value={lecturerName}
                    onChange={(e) => setLecturerName(e.target.value)}
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Faculty (optional)</Label>
                  <Select value={facultyId} onValueChange={(v) => setFacultyId(v ?? "")}>
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
                <Button
                  onClick={() => createCode.mutate()}
                  disabled={!lecturerName.trim() || createCode.isPending}
                  className="w-full"
                >
                  Generate Code
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lecturer Name</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-medium">{code.lecturerName}</TableCell>
                    <TableCell>{code.faculty?.name ?? "—"}</TableCell>
                    <TableCell>
                      {code.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Revoked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(new Date(code.createdAt))}
                    </TableCell>
                    <TableCell>
                      {code.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setRevokeId(code.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {codes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No lecturer codes yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Code</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently deactivate this lecturer code. The lecturer will no longer be able to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => revokeId && revokeCode.mutate(revokeId)}>
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
