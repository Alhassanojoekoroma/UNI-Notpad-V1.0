import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function StudentDashboardPage() {
  const session = await auth();
  const user = session?.user;

  let facultyName: string | null = null;
  let programName: string | null = null;

  if (user?.facultyId) {
    const [faculty, program] = await Promise.all([
      prisma.faculty.findUnique({
        where: { id: user.facultyId },
        select: { name: true },
      }),
      user.programId
        ? prisma.program.findUnique({
            where: { id: user.programId },
            select: { name: true },
          })
        : null,
    ]);
    facultyName = faculty?.name ?? null;
    programName = program?.name ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {user?.name?.split(" ")[0] ?? "Student"}
        </h1>
        {facultyName && (
          <p className="text-muted-foreground">
            {facultyName}
            {user?.semester ? ` — Semester ${user.semester}` : ""}
            {programName ? ` — ${programName}` : ""}
          </p>
        )}
      </div>

      <StatsCards />
      <QuickActions />
    </div>
  );
}
