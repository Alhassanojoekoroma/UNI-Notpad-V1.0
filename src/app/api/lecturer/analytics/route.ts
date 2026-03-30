import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "LECTURER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const lecturerId = session.user.id;

    const [
      contentStats,
      topContent,
      recentDownloads,
      allContent,
    ] = await Promise.all([
      // Aggregated stats
      prisma.content.aggregate({
        where: { lecturerId },
        _count: true,
        _sum: { viewCount: true, downloadCount: true },
      }),
      // Top 10 most viewed
      prisma.content.findMany({
        where: { lecturerId },
        orderBy: { viewCount: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          module: true,
          viewCount: true,
          downloadCount: true,
        },
      }),
      // Recent 20 downloads
      prisma.contentAccess.findMany({
        where: {
          accessType: "download",
          content: { lecturerId },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          createdAt: true,
          content: { select: { title: true } },
          user: { select: { name: true } },
        },
      }),
      // All content for per-content stats and type breakdown
      prisma.content.findMany({
        where: { lecturerId },
        select: {
          id: true,
          title: true,
          module: true,
          contentType: true,
          viewCount: true,
          downloadCount: true,
          averageRating: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Content type breakdown
    const typeBreakdown: Record<string, number> = {};
    for (const c of allContent) {
      typeBreakdown[c.contentType] = (typeBreakdown[c.contentType] ?? 0) + 1;
    }

    // Views over time (last 12 weeks) using raw access data
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const weeklyAccess = await prisma.contentAccess.findMany({
      where: {
        accessType: "view",
        content: { lecturerId },
        createdAt: { gte: twelveWeeksAgo },
      },
      select: { createdAt: true },
    });

    // Group by week
    const weeklyViews: Record<string, number> = {};
    for (const access of weeklyAccess) {
      const date = new Date(access.createdAt);
      // Get Monday of the week
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const key = monday.toISOString().split("T")[0];
      weeklyViews[key] = (weeklyViews[key] ?? 0) + 1;
    }

    // Fill missing weeks
    const viewsOverTime = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const key = monday.toISOString().split("T")[0];
      viewsOverTime.push({
        week: key,
        views: weeklyViews[key] ?? 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalContent: contentStats._count,
        totalViews: contentStats._sum.viewCount ?? 0,
        totalDownloads: contentStats._sum.downloadCount ?? 0,
        topContent,
        recentDownloads: recentDownloads.map((d) => ({
          id: d.id,
          contentTitle: d.content.title,
          userName: d.user.name,
          createdAt: d.createdAt,
        })),
        allContent,
        typeBreakdown: Object.entries(typeBreakdown).map(([type, count]) => ({
          type,
          count,
        })),
        viewsOverTime,
      },
    });
  } catch (error) {
    console.error("Lecturer analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
