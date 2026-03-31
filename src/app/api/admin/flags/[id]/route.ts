import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { flagUpdateSchema } from "@/lib/validators/admin";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = flagUpdateSchema.parse(body);

    // Get the flag with content info
    const flag = await prisma.contentFlag.findUnique({
      where: { id },
      include: { content: { select: { id: true, lecturerId: true } } },
    });

    if (!flag) {
      return NextResponse.json(
        { success: false, error: "Flag not found" },
        { status: 404 }
      );
    }

    // Apply action
    if (data.action === "REMOVE_CONTENT" && flag.content) {
      await prisma.content.update({
        where: { id: flag.content.id },
        data: { status: "ARCHIVED" },
      });
    }

    if (data.action === "WARN_UPLOADER" && flag.content?.lecturerId) {
      await prisma.notification.create({
        data: {
          userId: flag.content.lecturerId,
          type: "SYSTEM",
          title: "Content Warning",
          body: "Your content has been flagged and reviewed by an administrator. Please review our content policy.",
        },
      });
    }

    if (data.action === "SUSPEND_UPLOADER" && flag.content?.lecturerId) {
      await prisma.user.update({
        where: { id: flag.content.lecturerId },
        data: { isSuspended: true, suspendedReason: "Content violation" },
      });
    }

    const updated = await prisma.contentFlag.update({
      where: { id },
      data: {
        status: data.status,
        adminNotes: data.adminNotes ?? null,
        reviewedBy: session.user.id!,
        resolvedAt: data.status === "RESOLVED" ? new Date() : null,
      },
    });

    await createAuditLog({
      userId: session.user.id!,
      action: `flag.${data.action?.toLowerCase() ?? "updated"}`,
      entityType: "flag",
      entityId: id,
      metadata: { action: data.action, status: data.status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Update flag error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update flag" },
      { status: 500 }
    );
  }
}
