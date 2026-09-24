import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentScope } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const { module } = await params;
    const guard = await requireStudentScope();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const requestedSemester = Number(searchParams.get("semester"));
    if (
      Number.isFinite(requestedSemester) &&
      requestedSemester !== guard.user.semester
    ) {
      return NextResponse.json(
        { success: false, error: "This collection is not available to your account." },
        { status: 403 },
      );
    }

    const content = await prisma.content.findMany({
      where: {
        module: decodeURIComponent(module),
        semester: guard.user.semester,
        facultyId: guard.user.facultyId,
        status: "ACTIVE",
      },
      include: {
        lecturer: { select: { name: true } },
        faculty: { select: { name: true } },
        program: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("Failed to fetch collection materials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}
