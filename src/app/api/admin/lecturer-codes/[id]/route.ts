import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function DELETE(
  _request: Request,
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

    await prisma.lecturerCode.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });

    await createAuditLog({
      userId: session.user.id!,
      action: "lecturer_code.revoked",
      entityType: "lecturer_code",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke code error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to revoke code" },
      { status: 500 }
    );
  }
}
