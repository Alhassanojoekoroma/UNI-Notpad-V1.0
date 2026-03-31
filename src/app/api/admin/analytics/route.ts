import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      usersByRole,
      contentByType,
      recentSignups,
      recentAiUsage,
      totalContent,
      totalUsers,
      totalAiInteractions,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
        where: { deletedAt: null },
      }),
      prisma.content.groupBy({
        by: ["contentType"],
        _count: true,
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
        select: { createdAt: true, role: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.aIInteraction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, queryType: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.content.count(),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.aIInteraction.count(),
    ]);

    // Group signups by date
    const signupsByDate: Record<string, number> = {};
    for (const user of recentSignups) {
      const date = user.createdAt.toISOString().split("T")[0];
      signupsByDate[date] = (signupsByDate[date] ?? 0) + 1;
    }

    // Group AI usage by date
    const aiByDate: Record<string, number> = {};
    for (const interaction of recentAiUsage) {
      const date = interaction.createdAt.toISOString().split("T")[0];
      aiByDate[date] = (aiByDate[date] ?? 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: { totalUsers, totalContent, totalAiInteractions },
        usersByRole: usersByRole.map((r) => ({
          role: r.role,
          count: r._count,
        })),
        contentByType: contentByType.map((c) => ({
          type: c.contentType,
          count: c._count,
        })),
        signupTrend: Object.entries(signupsByDate).map(([date, count]) => ({
          date,
          count,
        })),
        aiUsageTrend: Object.entries(aiByDate).map(([date, count]) => ({
          date,
          count,
        })),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
