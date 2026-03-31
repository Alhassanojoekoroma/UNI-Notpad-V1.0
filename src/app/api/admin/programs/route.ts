import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { programSchema } from "@/lib/validators/admin";
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
    const data = programSchema.parse(body);

    const program = await prisma.program.create({ data });

    await createAuditLog({
      userId: session.user.id!,
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
