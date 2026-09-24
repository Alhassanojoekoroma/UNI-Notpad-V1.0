import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentDashboardData } from "@/lib/dashboard/student-data";
import { StudentDashboardClient } from "./dashboard-client";

export default async function StudentDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const data = await getStudentDashboardData(userId);

  return <StudentDashboardClient data={data} />;
}
