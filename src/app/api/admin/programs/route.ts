import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { programSchema } from "@/lib/validators/admin";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const data = programSchema.parse(body);

    const program = await prisma.program.create({ data });

    await createAuditLog({
      userId: guard.user.id,
      action: "program.created",
      entityType: "program",
      entityId: program.id,
      metadata: { name: program.name, code: program.code },
    });

    return NextResponse.json({ success: true, data: program }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Create program error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create program" },
      { status: 500 }
    );
  }
}
