import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const [
      totalStudents,
      totalLecturers,
      totalAdmins,
      totalContent,
      totalAiInteractions,
      recentRegistrations,
      recentAiQueries,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", deletedAt: null } }),
      prisma.user.count({ where: { role: "LECTURER", deletedAt: null } }),
      prisma.user.count({ where: { role: "ADMIN", deletedAt: null } }),
      prisma.content.count(),
      prisma.aIInteraction.count(),
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.aIInteraction.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          queryType: true,
          createdAt: true,
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalLecturers,
          totalAdmins,
          totalUsers: totalStudents + totalLecturers + totalAdmins,
          totalContent,
          totalAiInteractions,
        },
        recentRegistrations,
        recentAiQueries,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
