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

    const [stats, recentContent] = await Promise.all([
      prisma.content.aggregate({
        where: { lecturerId, status: { not: "ARCHIVED" } },
        _count: true,
        _sum: { viewCount: true, downloadCount: true },
        _avg: { averageRating: true },
      }),
      prisma.content.findMany({
        where: { lecturerId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          module: true,
          contentType: true,
          viewCount: true,
          downloadCount: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalContent: stats._count,
        totalViews: stats._sum.viewCount ?? 0,
        totalDownloads: stats._sum.downloadCount ?? 0,
        averageRating: stats._avg.averageRating
          ? Number(stats._avg.averageRating.toFixed(1))
          : null,
        recentContent,
      },
    });
  } catch (error) {
    console.error("Lecturer stats error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
