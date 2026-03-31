import { UserReports } from "@/components/admin/user-reports";

export default function UserReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Reports</h1>
        <p className="text-muted-foreground">
          Review and resolve user conduct reports
        </p>
      </div>
      <UserReports />
    </div>
  );
}
