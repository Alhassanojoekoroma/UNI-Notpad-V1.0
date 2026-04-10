import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { accessType } = await request.json();

    if (!["view", "download"].includes(accessType)) {
      return NextResponse.json(
        { success: false, error: "Invalid access type" },
        { status: 400 }
      );
    }

    // Verify user has permission to access this content
    const content = await prisma.content.findUnique({
      where: { id },
      select: { facultyId: true, semester: true },
    });
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }
    if (
      session.user.role === "STUDENT" &&
      (content.facultyId !== session.user.facultyId ||
        content.semester !== session.user.semester)
    ) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.contentAccess.create({
        data: {
          contentId: id,
          userId: session.user.id,
          accessType,
        },
      }),
      prisma.content.update({
        where: { id },
        data:
          accessType === "view"
            ? { viewCount: { increment: 1 } }
            : { downloadCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content access error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
