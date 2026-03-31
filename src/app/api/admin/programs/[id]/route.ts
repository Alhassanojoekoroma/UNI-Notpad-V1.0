import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { programSchema } from "@/lib/validators/admin";
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
    const data = programSchema.partial().parse(body);

    const program = await prisma.program.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: session.user.id!,
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
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const program = await prisma.program.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: session.user.id!,
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
