import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

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
