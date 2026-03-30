import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleSetupSchema } from "@/lib/validators/auth";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = roleSetupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { facultyId, semester, programId } = parsed.data;
    const studentId = (body as Record<string, unknown>).studentId as string | undefined;

    // Verify faculty exists
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) {
      return NextResponse.json(
        { success: false, error: "Invalid faculty" },
        { status: 400 }
      );
    }

    // Verify program belongs to faculty
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program || program.facultyId !== facultyId) {
      return NextResponse.json(
        { success: false, error: "Invalid program for selected faculty" },
        { status: 400 }
      );
    }

    // Check student ID uniqueness if provided
    if (studentId) {
      const existing = await prisma.user.findUnique({ where: { studentId } });
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "Student ID already in use" },
          { status: 409 }
        );
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        facultyId,
        semester,
        programId,
        studentId: studentId || undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
