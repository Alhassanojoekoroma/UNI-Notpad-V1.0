import { AdminAnalytics } from "@/components/admin/admin-analytics";
import { AuditLog } from "@/components/admin/audit-log";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Platform usage statistics and trends
        </p>
      </div>
      <AdminAnalytics />

      <div>
        <h2 className="text-xl font-bold mb-4">Audit Log</h2>
        <AuditLog />
      </div>
    </div>
  );
}
