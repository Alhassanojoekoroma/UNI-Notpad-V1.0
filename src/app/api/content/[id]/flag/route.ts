import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

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
    const { reason } = await request.json();

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { success: false, error: "Reason is required" },
        { status: 400 }
      );
    }

    const content = await prisma.content.findUnique({
      where: { id },
      select: { title: true },
    });

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    const flag = await prisma.contentFlag.create({
      data: {
        contentId: id,
        reporterId: session.user.id,
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
