import { UserManagement } from "@/components/admin/user-management";

export default function ManageUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and account status
        </p>
      </div>
      <UserManagement />
    </div>
  );
}
