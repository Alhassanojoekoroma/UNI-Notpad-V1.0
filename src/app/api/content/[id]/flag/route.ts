import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { canAccessContent, forbidden, requireUser } from "@/lib/rbac";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { reason } = await request.json();

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { success: false, error: "Reason is required" },
        { status: 400 }
      );
    }

    const content = await prisma.content.findUnique({
      where: { id },
      select: { title: true, facultyId: true, semester: true, status: true },
    });

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    if (!canAccessContent(guard.user, content)) {
      return forbidden("Access denied");
    }

    // Prevent duplicate flags from the same user
    const existingFlag = await prisma.contentFlag.findFirst({
      where: { contentId: id, reporterId: guard.user.id },
    });
    if (existingFlag) {
      return NextResponse.json(
        { success: false, error: "You have already flagged this content" },
        { status: 409 }
      );
    }

    const flag = await prisma.contentFlag.create({
      data: {
        contentId: id,
        reporterId: guard.user.id,
        reason,
      },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          "CONTENT_FLAGGED",
          "Content Flagged",
          `"${content.title}" was flagged: ${reason}`,
          "content",
          id
        )
      )
    );

    return NextResponse.json({ success: true, data: flag }, { status: 201 });
  } catch (error) {
    console.error("Content flag error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
