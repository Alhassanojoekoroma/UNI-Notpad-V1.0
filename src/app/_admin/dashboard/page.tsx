import { auth } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const name = session?.user?.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {name}
        </h1>
        <p className="text-muted-foreground">
          Overview of your university platform
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
