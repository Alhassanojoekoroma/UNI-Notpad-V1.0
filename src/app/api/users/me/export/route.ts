import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { exportQuerySchema } from "@/lib/validators/export";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = request.nextUrl;
    const parsed = exportQuerySchema.safeParse({
      format: searchParams.get("format") ?? undefined,
      type: searchParams.get("type") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { format, type } = parsed.data;

    // CSV exports
    if (format === "csv") {
      if (type === "quiz_scores") {
        const scores = await prisma.quizScore.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        const header = "module,quizType,score,totalQuestions,createdAt";
        const rows = scores.map(
          (s) => `"${s.module}","${s.quizType}",${s.score},${s.totalQuestions},${s.createdAt.toISOString()}`
        );
        const csv = [header, ...rows].join("\n");

        await createAuditLog({
          userId,
          action: "user.data_exported",
          entityType: "user",
          entityId: userId,
          metadata: { format: "csv", type: "quiz_scores" },
        });

        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="quiz_scores.csv"',
          },
        });
      }

      if (type === "content_access") {
        const access = await prisma.contentAccess.findMany({
          where: { userId },
          include: {
            content: { select: { title: true, module: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const header = "contentTitle,module,accessType,createdAt";
        const rows = access.map(
          (a) =>
            `"${a.content.title.replace(/"/g, '""')}","${a.content.module}","${a.accessType}",${a.createdAt.toISOString()}`
        );
        const csv = [header, ...rows].join("\n");

        await createAuditLog({
          userId,
          action: "user.data_exported",
          entityType: "user",
          entityId: userId,
          metadata: { format: "csv", type: "content_access" },
        });

        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="content_access.csv"',
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "CSV export requires a type parameter (quiz_scores or content_access)" },
        { status: 400 }
      );
    }

    // Full JSON export (default)
    const [
      profile,
      tasks,
      schedule,
      sentMessages,
      aiInteractions,
      quizScores,
      learningGoals,
      contentRatings,
      contentAccess,
      referrals,
      forumPosts,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          facultyId: true,
          semester: true,
          programId: true,
          studentId: true,
          avatarUrl: true,
          referralCode: true,
          createdAt: true,
        },
      }),
      prisma.task.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.schedule.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          recipientId: true,
          subject: true,
          body: true,
          createdAt: true,
          isRead: true,
        },
      }),
      prisma.aIInteraction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          conversationId: true,
          query: true,
          response: true,
          queryType: true,
          learningLevel: true,
          tokensUsed: true,
          createdAt: true,
        },
      }),
      prisma.quizScore.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.learningGoal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.contentRating.findMany({
        where: { userId },
        include: { content: { select: { title: true, module: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.contentAccess.findMany({
        where: { userId },
        include: { content: { select: { title: true, module: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.referral.findMany({
        where: { OR: [{ referrerId: userId }, { refereeId: userId }] },
        orderBy: { createdAt: "desc" },
      }),
      prisma.forumPost.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          module: true,
          title: true,
          body: true,
          upvoteCount: true,
          createdAt: true,
        },
      }),
    ]);

    const exportData = {
      profile,
      tasks,
      schedule,
      sentMessages,
      aiInteractions,
      quizScores,
      learningGoals,
      contentRatings,
      contentAccess,
      referrals,
      forumPosts,
      exportedAt: new Date().toISOString(),
    };

    await createAuditLog({
      userId,
      action: "user.data_exported",
      entityType: "user",
      entityId: userId,
      metadata: { format: "json" },
    });

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="my-data-export.json"',
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export data" },
      { status: 500 }
    );
  }
}
