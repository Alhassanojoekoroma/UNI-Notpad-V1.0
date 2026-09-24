import { prisma } from "@/lib/prisma";

export interface StudentDashboardData {
  studentName: string;
  faculty: string;
  semester: number;
  unreadMessages: number;
  upcomingDeadlines: number;
  nextDeadlineDays: number | null;
  aiQueriesLeft: number;
  aiQueriesReset: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    due: string;
    badge: string;
    badgeColor: "bg-r" | "bg-y" | "bg-b" | "bg-g";
    avatar: { bg: string; text: string; initials: string };
  }>;
  activeCourses: Array<{
    progressPercent: number;
    name: string;
    semester: number;
  }>;
  weekProgress: Array<{
    week: number;
    progressPercent: number;
  }>;
  enrolledCount: number;
  recentMaterials: Array<{
    id: string;
    title: string;
    module: string;
    week: number;
  }>;
}

export async function getStudentDashboardData(
  userId: string
): Promise<StudentDashboardData> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      faculty: true,
    },
  });

  if (!user || user.role !== "STUDENT") {
    throw new Error("User not found or is not a student");
  }

  if (!user.facultyId || user.semester === null) {
    throw new Error("Student academic profile is incomplete");
  }

  const contentWhere = {
    facultyId: user.facultyId,
    semester: user.semester,
    status: "ACTIVE" as const,
  };

  const [userTasks, unreadMessages, visibleContent] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
      take: 5,
    }),
    prisma.message.count({ where: { recipientId: userId, isRead: false } }),
    prisma.content.findMany({
      where: contentWhere,
      select: {
        id: true,
        title: true,
        module: true,
        semester: true,
        week: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const accessRows = visibleContent.length
    ? await prisma.contentAccess.findMany({
        where: { userId, contentId: { in: visibleContent.map((item) => item.id) } },
        select: { contentId: true },
        distinct: ["contentId"],
      })
    : [];
  const accessedContentIds = new Set(accessRows.map((row) => row.contentId));

  // Calculate upcoming deadlines
  const now = new Date();
  const upcomingTasks = userTasks.filter((t) => {
    if (!t.deadline) return false;
    return new Date(t.deadline) > now && t.status === "PENDING";
  });
  const nextDeadline = upcomingTasks[0]?.deadline;
  const nextDeadlineDays = nextDeadline
    ? Math.ceil(
        (new Date(nextDeadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Get AI queries left
  const aiQueriesLeft = user.freeQueriesRemaining ?? 20;
  const aiQueriesReset = user.freeQueriesResetAt
    ? `Resets ${new Date(user.freeQueriesResetAt).toLocaleDateString()}`
    : "Daily allowance";

  // Format tasks for display
  const formattedTasks = userTasks.map((task) => {
    const colors = [
      { bg: "#fde8e8", text: "#c0392b" },
      { bg: "#e8f4fd", text: "#1a6fa3" },
      { bg: "#fef9e7", text: "#b7770d" },
      { bg: "#e8f4fd", text: "#1a6fa3" },
      { bg: "#eafaf1", text: "#1e8449" },
    ];
    const color = colors[Math.abs(task.id.length) % colors.length];
    const title = task.title.slice(0, 25);
    const initials = title
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    let dueText = "No due date";
    if (task.deadline) {
      const daysUntil = Math.ceil(
        (new Date(task.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil < 0) dueText = "Overdue";
      else if (daysUntil === 0) dueText = "Today";
      else if (daysUntil === 1) dueText = "Tomorrow";
      else if (daysUntil <= 7) dueText = `in ${daysUntil} days`;
      else dueText = `in ${daysUntil} days`;
    }

    const isOverdue = Boolean(task.deadline && new Date(task.deadline) < now);
    const badge = task.status === "COMPLETED"
      ? "Done"
      : isOverdue
        ? "Overdue"
        : task.priority === "HIGH"
          ? "High priority"
          : task.priority === "LOW"
            ? "Low priority"
            : "Pending";
    const badgeColor: "bg-r" | "bg-y" | "bg-b" | "bg-g" =
      task.status === "COMPLETED" ? "bg-g" : isOverdue || task.priority === "HIGH" ? "bg-r" : task.priority === "LOW" ? "bg-b" : "bg-y";

    return {
      id: task.id,
      title,
      description: task.description,
      due: dueText,
      badge,
      badgeColor,
      avatar: {
        bg: color.bg,
        text: color.text,
        initials: initials || "TK",
      },
    };
  });

  const courseTotals = new Map<string, { total: number; accessed: number }>();
  const weekTotals = new Map<number, { total: number; accessed: number }>();
  for (const item of visibleContent) {
    const seen = accessedContentIds.has(item.id);
    const course = courseTotals.get(item.module) ?? { total: 0, accessed: 0 };
    course.total++;
    if (seen) course.accessed++;
    courseTotals.set(item.module, course);

    const week = weekTotals.get(item.week) ?? { total: 0, accessed: 0 };
    week.total++;
    if (seen) week.accessed++;
    weekTotals.set(item.week, week);
  }

  const activeCourses = Array.from(courseTotals, ([name, counts]) => ({
    name,
    semester: user.semester!,
    progressPercent: Math.round((counts.accessed / counts.total) * 100),
  })).slice(0, 3);

  const weekProgress = Array.from(weekTotals, ([week, counts]) => ({
    week,
    progressPercent: Math.round((counts.accessed / counts.total) * 100),
  }))
    .sort((a, b) => a.week - b.week)
    .slice(0, 4);

  return {
    studentName: user.name || "Student",
    faculty: user.faculty?.name || "Faculty not assigned",
    semester: user.semester,
    unreadMessages,
    upcomingDeadlines: upcomingTasks.length,
    nextDeadlineDays,
    aiQueriesLeft,
    aiQueriesReset,
    tasks: formattedTasks,
    activeCourses,
    weekProgress,
    enrolledCount: courseTotals.size,
    recentMaterials: visibleContent.slice(0, 4).map(({ id, title, module, week }) => ({
      id,
      title,
      module,
      week,
    })),
  };
}
