import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { contentScopeFilter, requireUser } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: { content: [], tasks: [], schedule: [], messages: [], forum: [] },
      });
    }

    const searchTerm = q.slice(0, 100);
    const userId = guard.user.id;
    const limit = 5;

    // Same isolation rules as /api/content. `?? undefined` was used here, which
    // made Prisma drop the faculty constraint whenever the claim was null and
    // silently widened the search to every faculty.
    const contentScope = contentScopeFilter(
      guard.user,
    ) as Prisma.ContentWhereInput;

    // Forum threads are faculty-scoped for everyone except admins.
    const forumScope: Prisma.ForumPostWhereInput =
      guard.user.role === "ADMIN"
        ? {}
        : { facultyId: guard.user.facultyId ?? "__unassigned__" };

    const [content, tasks, schedule, messages, forum] = await Promise.all([
      prisma.content.findMany({
        where: {
          status: "ACTIVE",
          ...contentScope,
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
          ...forumScope,
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
