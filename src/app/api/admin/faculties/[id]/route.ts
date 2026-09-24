import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { facultySchema } from "@/lib/validators/admin";
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
    const data = facultySchema.partial().parse(body);

    const faculty = await prisma.faculty.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: guard.user.id,
      action: "faculty.updated",
      entityType: "faculty",
      entityId: id,
      metadata: data,
    });

    return NextResponse.json({ success: true, data: faculty });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Update faculty error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update faculty" },
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

    const faculty = await prisma.faculty.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: guard.user.id,
      action: "faculty.deactivated",
      entityType: "faculty",
      entityId: id,
    });

    return NextResponse.json({ success: true, data: faculty });
  } catch (error) {
    console.error("Delete faculty error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate faculty" },
      { status: 500 }
    );
  }
}
