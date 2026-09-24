import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";

    const where: Record<string, unknown> = {};
    if (status && ["PENDING", "REVIEWED", "RESOLVED"].includes(status)) {
      where.status = status;
    }

    const reports = await prisma.userReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        reportedUser: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("List reports error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load reports" },
      { status: 500 }
    );
  }
}
