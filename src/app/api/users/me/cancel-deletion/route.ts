import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });

    if (!user?.deletedAt) {
      return NextResponse.json(
        { success: false, error: "No pending deletion to cancel" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        isActive: true,
      },
    });

    await createAuditLog({
      userId,
      action: "user.deletion_cancelled",
      entityType: "user",
      entityId: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel deletion" },
      { status: 500 }
    );
  }
}
