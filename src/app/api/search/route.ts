import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: { content: [], tasks: [], schedule: [], messages: [], forum: [] },
      });
    }

    const searchTerm = q;
    const userId = session.user.id;
    const limit = 5;

    const [content, tasks, schedule, messages, forum] = await Promise.all([
      prisma.content.findMany({
        where: {
          status: "ACTIVE",
          facultyId: session.user.facultyId ?? undefined,
          semester: session.user.semester ?? undefined,
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { module: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, module: true },
        take: limit,
      }),
      prisma.task.findMany({
        where: {
          userId,
          title: { contains: searchTerm, mode: "insensitive" },
        },
        select: { id: true, title: true },
        take: limit,
      }),
      prisma.schedule.findMany({
        where: {
          userId,
          subject: { contains: searchTerm, mode: "insensitive" },
        },
        select: { id: true, subject: true, dayOfWeek: true },
        take: limit,
      }),
      prisma.message.findMany({
        where: {
          OR: [
            { recipientId: userId },
            { senderId: userId },
          ],
          subject: { contains: searchTerm, mode: "insensitive" },
        },
        select: { id: true, subject: true },
        take: limit,
      }),
      prisma.forumPost.findMany({
        where: {
          facultyId: session.user.facultyId ?? undefined,
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { body: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, module: true },
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        content: content.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.module,
          category: "content" as const,
          href: `/content/${c.id}`,
        })),
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: "Task",
          category: "tasks" as const,
          href: "/tasks",
        })),
        schedule: schedule.map((s) => ({
          id: s.id,
          title: s.subject,
          subtitle: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][s.dayOfWeek],
          category: "schedule" as const,
          href: "/schedule",
        })),
        messages: messages.map((m) => ({
          id: m.id,
          title: m.subject,
          subtitle: "Message",
          category: "messages" as const,
          href: "/messages",
        })),
        forum: forum.map((f) => ({
          id: f.id,
          title: f.title ?? f.module,
          subtitle: f.module,
          category: "forum" as const,
          href: `/forum/${f.module}`,
        })),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
