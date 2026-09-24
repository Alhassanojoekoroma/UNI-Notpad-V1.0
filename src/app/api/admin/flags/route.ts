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

    const flags = await prisma.contentFlag.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        content: { select: { id: true, title: true, status: true } },
        reporter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: flags });
  } catch (error) {
    console.error("List flags error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load flags" },
      { status: 500 }
    );
  }
}
