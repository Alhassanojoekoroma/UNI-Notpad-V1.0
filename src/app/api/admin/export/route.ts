import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [
      usersByFacultyAndRole,
      totalUsers,
      totalContent,
      contentEngagement,
      totalAiInteractions,
      aiUsersCount,
      quizStats,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ["facultyId", "role"],
        _count: true,
        where: { deletedAt: null },
      }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.content.count(),
      prisma.contentAccess.groupBy({
        by: ["accessType"],
        _count: true,
      }),
      prisma.aIInteraction.count(),
      prisma.aIInteraction.groupBy({
        by: ["userId"],
        _count: true,
      }),
      prisma.quizScore.aggregate({
        _count: true,
        _avg: { score: true },
      }),
    ]);

    const engagementMap: Record<string, number> = {};
    for (const e of contentEngagement) {
      engagementMap[e.accessType] = e._count;
    }

    const exportData = {
      generatedAt: new Date().toISOString(),
      users: {
        total: totalUsers,
        byFacultyAndRole: usersByFacultyAndRole.map((g) => ({
          facultyId: g.facultyId,
          role: g.role,
          count: g._count,
        })),
      },
      content: {
        total: totalContent,
        totalViews: engagementMap["view"] ?? 0,
        totalDownloads: engagementMap["download"] ?? 0,
      },
      ai: {
        totalInteractions: totalAiInteractions,
        uniqueUsers: aiUsersCount.length,
        avgInteractionsPerUser:
          aiUsersCount.length > 0
            ? Math.round(totalAiInteractions / aiUsersCount.length)
            : 0,
      },
      quizzes: {
        totalTaken: quizStats._count,
        averageScore: quizStats._avg.score
          ? Math.round(quizStats._avg.score * 100) / 100
          : null,
      },
    };

    await createAuditLog({
      userId: session.user.id,
      action: "admin.data_exported",
      entityType: "platform",
      entityId: "export",
    });

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="platform-export.json"',
      },
    });
  } catch (error) {
    console.error("Admin export error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export platform data" },
      { status: 500 }
    );
  }
}
