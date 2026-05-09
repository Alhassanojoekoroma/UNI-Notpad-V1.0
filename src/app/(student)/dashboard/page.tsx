import { auth } from "@/lib/auth";
import { getStudentDashboardData } from "@/lib/dashboard/student-data";
import { StudentDashboardClient } from "./dashboard-client";

export default async function StudentDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return <div style={{ padding: "20px" }}>Error: User not found</div>;
  }

  const data = await getStudentDashboardData(userId);

  return <StudentDashboardClient data={data} />;
}
