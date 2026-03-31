import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lecturerCodeSchema } from "@/lib/validators/admin";
import { createAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const codes = await prisma.lecturerCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Manually resolve faculty names since there's no relation
    const facultyIds = codes.map((c) => c.facultyId).filter(Boolean) as string[];
    const faculties = facultyIds.length
      ? await prisma.faculty.findMany({
          where: { id: { in: facultyIds } },
          select: { id: true, name: true },
        })
      : [];
    const facultyMap = new Map(faculties.map((f) => [f.id, f.name]));

    const codesWithFaculty = codes.map((c) => ({
      ...c,
      faculty: c.facultyId ? { name: facultyMap.get(c.facultyId) ?? null } : null,
    }));

    return NextResponse.json({ success: true, data: codesWithFaculty });
  } catch (error) {
    console.error("List codes error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load codes" },
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
    const data = lecturerCodeSchema.parse(body);

    // Generate random code
    const plainCode = crypto.randomBytes(6).toString("hex").toUpperCase();
    const hashedCode = await bcrypt.hash(plainCode, 12);

    const code = await prisma.lecturerCode.create({
      data: {
        code: hashedCode,
        lecturerName: data.lecturerName,
        facultyId: data.facultyId || null,
        createdBy: session.user.id!,
      },
    });

    await createAuditLog({
      userId: session.user.id!,
      action: "lecturer_code.created",
      entityType: "lecturer_code",
      entityId: code.id,
      metadata: { lecturerName: data.lecturerName },
    });

    // Return plaintext code only once
    return NextResponse.json(
      { success: true, data: { ...code, plainCode } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Create code error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create code" },
      { status: 500 }
    );
  }
}
