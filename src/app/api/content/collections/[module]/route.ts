import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const { module } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const semester = searchParams.get("semester");

    const content = await prisma.content.findMany({
      where: {
        module: decodeURIComponent(module),
        semester: semester ? Number(semester) : session.user.semester || 1,
        facultyId: session.user.facultyId || undefined,
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
