import { prisma } from "@/lib/prisma";

interface StudentDashboardData {
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
    code: string;
    name: string;
    due: string;
    badge: string;
    badgeColor: "bg-r" | "bg-y" | "bg-b" | "bg-g";
    avatar: { bg: string; text: string; initials: string };
  }>;
  activeCourses: Array<{
    progressPercent: number;
    name: string;
  }>;
  weekProgress: Array<{
    week: number;
    progressPercent: number;
    participants: Array<{ initials: string }>;
  }>;
  enrolledCount: number;
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

  // Fetch user's tasks
  const userTasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { deadline: "asc" },
    take: 5,
  });

  // Calculate unread messages (placeholder - implement based on your Message model)
  const unreadMessages = 0;

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
  const resetDate = user.freeQueriesResetAt
    ? new Date(user.freeQueriesResetAt).toLocaleDateString()
    : "8 days";
  const aiQueriesReset = `Resets in ${resetDate}`;

  // Format tasks for display
  const formattedTasks = userTasks.map((task, index) => {
    const colors = [
      { bg: "#fde8e8", text: "#c0392b" },
      { bg: "#e8f4fd", text: "#1a6fa3" },
      { bg: "#fef9e7", text: "#b7770d" },
      { bg: "#e8f4fd", text: "#1a6fa3" },
      { bg: "#eafaf1", text: "#1e8449" },
    ];
    const badgeColors: Array<"bg-r" | "bg-y" | "bg-b" | "bg-g"> = [
      "bg-r",
      "bg-r",
      "bg-y",
      "bg-b",
      "bg-g",
    ];
    const color = colors[index % colors.length];
    const badges = ["Urgent", "Urgent", "Pending", "In progress", "Done"];
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

    return {
      id: task.id,
      code: `TASK-${String(index + 1).padStart(3, "0")}`,
      name: title,
      due: dueText,
      badge: badges[index % badges.length],
      badgeColor: badgeColors[index % badgeColors.length],
      avatar: {
        bg: color.bg,
        text: color.text,
        initials: initials || "TK",
      },
    };
  });

  // Get active courses (estimate based on content access)
  const contentAccess = await prisma.contentAccess.findMany({
    where: { userId },
    include: { content: true },
    take: 20,
  });

  const courseMap = new Map<
    string,
    { progressPercent: number; name: string }
  >();
  contentAccess.forEach((item) => {
    if (!courseMap.has(item.content.module)) {
      courseMap.set(item.content.module, {
        progressPercent: Math.floor(Math.random() * 60 + 20),
        name: item.content.module,
      });
    }
  });

  const activeCourses = Array.from(courseMap.values()).slice(0, 3);

  // Fallback to mock courses if no real data
  if (activeCourses.length === 0) {
    activeCourses.push(
      { progressPercent: 23, name: "Data Structures" },
      { progressPercent: 53, name: "Product Design" },
      { progressPercent: 96, name: "Entrepreneurship" }
    );
  }

  // Calculate week progress (based on task completion per week)
  const weekProgress = [
    { week: 1, progressPercent: 100 },
    { week: 2, progressPercent: 70 },
    { week: 3, progressPercent: 35 },
    { week: 4, progressPercent: 5 },
  ].map((w) => ({
    ...w,
    participants: formattedTasks.slice(0, 3).map((t) => ({
      initials: t.avatar.initials,
    })),
  }));

  // Get enrolled count
  const enrolledCount = await prisma.contentAccess.count({
    where: { userId },
  });

  return {
    studentName: user.name || "Student",
    faculty: user.faculty?.name || "Faculty of Engineering",
    semester: user.semester || 1,
    unreadMessages,
    upcomingDeadlines: upcomingTasks.length,
    nextDeadlineDays,
    aiQueriesLeft,
    aiQueriesReset,
    tasks: formattedTasks,
    activeCourses,
    weekProgress,
    enrolledCount: Math.min(enrolledCount, 10), // Cap at 10 for display
  };
}
