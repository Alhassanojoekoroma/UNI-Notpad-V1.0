import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { facultySchema } from "@/lib/validators/admin";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const faculties = await prisma.faculty.findMany({
      include: { programs: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: faculties });
  } catch (error) {
    console.error("Get faculties error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load faculties" },
      { status: 500 }
    );
  }
}

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
    const data = facultySchema.parse(body);

    const faculty = await prisma.faculty.create({ data });

    await createAuditLog({
      userId: session.user.id!,
      action: "faculty.created",
      entityType: "faculty",
      entityId: faculty.id,
      metadata: { name: faculty.name, code: faculty.code },
    });

    return NextResponse.json({ success: true, data: faculty }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Create faculty error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create faculty" },
      { status: 500 }
    );
  }
}
