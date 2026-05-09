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

    // Role-based access control
    if (session.user.role === "STUDENT") {
      // Students can only access content from their faculty/semester
      if (
        content.facultyId !== session.user.facultyId ||
        content.semester !== session.user.semester
      ) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "LECTURER") {
      // Lecturers can only access content from their faculty
      if (content.facultyId !== session.user.facultyId) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }
    }
    // Admins can access all content

    // Rate limiting: Check if user accessed same content with same type in last hour
    // This prevents artificially inflating view/download counts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAccess = await prisma.contentAccess.findFirst({
      where: {
        contentId: id,
        userId: session.user.id,
        accessType,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    // Only log if it's a new access or more than an hour has passed
    if (!recentAccess) {
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
    } else {
      // Still log the access without incrementing counters
      await prisma.contentAccess.create({
        data: {
          contentId: id,
          userId: session.user.id,
          accessType,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content access error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
