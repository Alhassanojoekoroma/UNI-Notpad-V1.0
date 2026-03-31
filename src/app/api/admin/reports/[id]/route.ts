import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportUpdateSchema } from "@/lib/validators/admin";
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
    const data = reportUpdateSchema.parse(body);

    const report = await prisma.userReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    // Apply action on reported user
    if (data.actionTaken === "WARN") {
      await prisma.notification.create({
        data: {
          userId: report.reportedUserId,
          type: "SYSTEM",
          title: "Account Warning",
          body: "Your account has been reported and reviewed. Please review our community guidelines.",
        },
      });
    }

    if (data.actionTaken === "SUSPEND") {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isSuspended: true, suspendedReason: data.adminNotes ?? "User report violation" },
      });
    }

    if (data.actionTaken === "BAN") {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isActive: false, isSuspended: true, suspendedReason: "Permanently banned" },
      });
    }

    const updated = await prisma.userReport.update({
      where: { id },
      data: {
        status: data.status,
        adminNotes: data.adminNotes ?? null,
        actionTaken: data.actionTaken ?? null,
        reviewedBy: session.user.id!,
        resolvedAt: data.status === "RESOLVED" ? new Date() : null,
      },
    });

    await createAuditLog({
      userId: session.user.id!,
      action: `report.${data.actionTaken?.toLowerCase() ?? "updated"}`,
      entityType: "report",
      entityId: id,
      metadata: { actionTaken: data.actionTaken, status: data.status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Update report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update report" },
      { status: 500 }
    );
  }
}
