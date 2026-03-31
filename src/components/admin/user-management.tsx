"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/lib/constants";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  isSuspended: boolean;
  isActive: boolean;
  createdAt: string;
  faculty: { name: string } | null;
}

interface UserDetail {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  isSuspended: boolean;
  suspendedReason: string | null;
  isActive: boolean;
  studentId: string | null;
  createdAt: string;
  faculty: { id: string; name: string } | null;
  program: { id: string; name: string } | null;
  _count: { contents: number; aiInteractions: number };
}

export function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ id: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter, debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      return res.json();
    },
  });

  const { data: userDetail } = useQuery({
    queryKey: ["admin-user-detail", selectedUser],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${selectedUser}`);
      return res.json();
    },
    enabled: !!selectedUser,
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail"] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteDialog(null);
    },
  });

  const users: User[] = data?.data ?? [];
  const pagination = data?.pagination;
  const detail: UserDetail | null = userDetail?.data ?? null;

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <Tabs value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="STUDENT">Students</TabsTrigger>
            <TabsTrigger value="LECTURER">Lecturers</TabsTrigger>
            <TabsTrigger value="ADMIN">Admins</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* User table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{user.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user.faculty?.name ?? "—"}</TableCell>
                    <TableCell>
                      {user.isSuspended ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : !user.isActive ? (
                        <Badge variant="outline">Inactive</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(new Date(user.createdAt))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedUser(user.id)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setRoleChangeDialog({ id: user.id, currentRole: user.role }); setNewRole(user.role); }}>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.isSuspended ? (
                            <DropdownMenuItem onClick={() => updateUser.mutate({ id: user.id, isSuspended: false })}>
                              Unsuspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => updateUser.mutate({ id: user.id, isSuspended: true })}>
                              Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDialog(user.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pagination.pageSize + 1}–{Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User detail sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
          </SheetHeader>
          {detail && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <p className="text-lg font-medium">{detail.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{detail.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Role:</span>{" "}
                  <Badge variant="secondary">{detail.role}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {detail.isSuspended ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
                {detail.studentId && (
                  <div>
                    <span className="text-muted-foreground">Student ID:</span> {detail.studentId}
                  </div>
                )}
                {detail.faculty && (
                  <div>
                    <span className="text-muted-foreground">Faculty:</span> {detail.faculty.name}
                  </div>
                )}
                {detail.program && (
                  <div>
                    <span className="text-muted-foreground">Program:</span> {detail.program.name}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Content:</span> {detail._count.contents}
                </div>
                <div>
                  <span className="text-muted-foreground">AI Queries:</span> {detail._count.aiInteractions}
                </div>
                <div>
                  <span className="text-muted-foreground">Joined:</span>{" "}
                  {new Date(detail.createdAt).toLocaleDateString()}
                </div>
              </div>
              {detail.suspendedReason && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Suspension reason:</span>{" "}
                  {detail.suspendedReason}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the user account. The account can be restored within 7 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog && deleteUser.mutate(deleteDialog)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role change dialog */}
      <AlertDialog open={!!roleChangeDialog} onOpenChange={(open) => !open && setRoleChangeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Select the new role for this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={newRole} onValueChange={(v) => setNewRole(v ?? "")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="LECTURER">Lecturer</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roleChangeDialog) {
                  updateUser.mutate({ id: roleChangeDialog.id, role: newRole });
                  setRoleChangeDialog(null);
                }
              }}
            >
              Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
