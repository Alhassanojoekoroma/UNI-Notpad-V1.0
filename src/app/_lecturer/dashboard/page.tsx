import { auth } from "@/lib/auth";
import { LecturerDashboardStats } from "@/components/lecturer/dashboard-stats";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function LecturerDashboardPage() {
  const session = await auth();
  const name = session?.user?.name?.split(" ")[0] ?? "Lecturer";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {name}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your content and engagement
        </p>
      </div>
      <LecturerDashboardStats />
    </div>
  );
}
