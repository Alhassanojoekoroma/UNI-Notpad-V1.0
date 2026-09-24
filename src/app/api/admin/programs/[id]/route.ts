import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { programSchema } from "@/lib/validators/admin";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await request.json();
    const data = programSchema.partial().parse(body);

    const program = await prisma.program.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: guard.user.id,
      action: "program.updated",
      entityType: "program",
      entityId: id,
      metadata: data,
    });

    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Update program error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update program" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const program = await prisma.program.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: guard.user.id,
      action: "program.deactivated",
      entityType: "program",
      entityId: id,
    });

    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error("Delete program error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate program" },
      { status: 500 }
    );
  }
}
