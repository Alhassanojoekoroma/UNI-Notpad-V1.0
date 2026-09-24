import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    const { id } = await params;

    await prisma.lecturerCode.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });

    await createAuditLog({
      userId: guard.user.id,
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
