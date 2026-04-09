import { BulkMessaging } from "@/components/admin/bulk-messaging";

export default function BulkMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Messages</h1>
        <p className="text-muted-foreground">
          Send messages to groups of users
        </p>
      </div>
      <BulkMessaging />
    </div>
  );
}
