import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roleSetupSchema } from "@/lib/validators/auth";
import { requireRole } from "@/lib/rbac";
import { validateStudentId } from "@/lib/student-id";

/**
 * Post-OAuth profile completion for students.
 *
 * Restricted to STUDENT deliberately. Faculty membership is the authorisation
 * gate for lecturer uploads and forum moderation, so letting any authenticated
 * user PATCH their own `facultyId` was a privilege-escalation path: a lecturer
 * could move themselves into any faculty and publish there. Lecturer and admin
 * faculty assignment is an administrative action.
 */
export async function PATCH(request: Request) {
  try {
    const guard = await requireRole("STUDENT");
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const parsed = roleSetupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid input",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    // `studentId` now comes from the parsed schema. It used to be read straight
    // off the raw body, bypassing validation entirely.
    const { facultyId, semester, programId, studentId } = parsed.data;

    const studentIdError = await validateStudentId(studentId);
    if (studentIdError) {
      return NextResponse.json(
        { success: false, error: studentIdError },
        { status: 400 },
      );
    }

    const [faculty, program, existingStudentId] = await Promise.all([
      prisma.faculty.findFirst({
        where: { id: facultyId, isActive: true },
        select: { id: true },
      }),
      prisma.program.findFirst({
        where: { id: programId, facultyId, isActive: true },
        select: { id: true },
      }),
      prisma.user.findFirst({ where: { studentId }, select: { id: true } }),
    ]);

    if (!faculty) {
      return NextResponse.json(
        { success: false, error: "Invalid faculty" },
        { status: 400 },
      );
    }

    if (!program) {
      return NextResponse.json(
        { success: false, error: "Invalid program for the selected faculty" },
        { status: 400 },
      );
    }

    if (existingStudentId && existingStudentId.id !== guard.user.id) {
      return NextResponse.json(
        { success: false, error: "Student ID already in use" },
        { status: 409 },
      );
    }

    await prisma.user.update({
      where: { id: guard.user.id },
      data: { facultyId, semester, programId, studentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "Student ID already in use" },
        { status: 409 },
      );
    }
    console.error("Profile setup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
