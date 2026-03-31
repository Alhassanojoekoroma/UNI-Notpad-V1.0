import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bulkMessageSchema } from "@/lib/validators/admin";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = bulkMessageSchema.parse(body);

    // Build recipient filter
    const where: Record<string, unknown> = {
      deletedAt: null,
      isActive: true,
    };

    const { type, role, facultyId, semester } = data.recipientFilter;

    if (type === "ROLE" && role) {
      where.role = role;
    } else if (type === "FACULTY" && facultyId) {
      where.facultyId = facultyId;
    } else if (type === "SEMESTER" && semester) {
      where.semester = semester;
    }

    // Get recipient count
    const recipients = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    // Preview mode — just return count
    if (data.preview) {
      return NextResponse.json({
        success: true,
        data: { recipientCount: recipients.length },
      });
    }

    // Create messages and notifications
    if (recipients.length > 0) {
      await prisma.message.createMany({
        data: recipients.map((r) => ({
          senderId: session.user.id!,
          recipientId: r.id,
          subject: data.subject,
          body: data.body,
        })),
      });

      await prisma.notification.createMany({
        data: recipients.map((r) => ({
          userId: r.id,
          type: "MESSAGE_RECEIVED" as const,
          title: data.subject,
          body: data.body.slice(0, 200),
        })),
      });
    }

    await createAuditLog({
      userId: session.user.id!,
      action: "bulk_message.sent",
      entityType: "message",
      entityId: "bulk",
      metadata: {
        recipientCount: recipients.length,
        filter: data.recipientFilter,
        subject: data.subject,
      },
    });

    return NextResponse.json({
      success: true,
      data: { recipientCount: recipients.length },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Bulk message error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send messages" },
      { status: 500 }
    );
  }
}
