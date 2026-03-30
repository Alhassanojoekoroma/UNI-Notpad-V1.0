import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import { BCRYPT_ROUNDS } from "@/lib/constants";
import { generateReferralCode } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password, role, studentId, referralCode } = parsed.data;
    const { accessCode, facultyId, semester, programId, termsAccepted, privacyAccepted } =
      body as Record<string, unknown>;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check student ID uniqueness if provided
    if (studentId) {
      const existingStudent = await prisma.user.findUnique({
        where: { studentId },
      });
      if (existingStudent) {
        return NextResponse.json(
          { success: false, error: "Student ID already registered" },
          { status: 409 }
        );
      }
    }

    // Validate lecturer access code
    if (role === "LECTURER") {
      if (!accessCode || typeof accessCode !== "string") {
        return NextResponse.json(
          { success: false, error: "Access code is required for lecturers" },
          { status: 400 }
        );
      }
      const lecturerCodes = await prisma.lecturerCode.findMany({
        where: { isActive: true, revokedAt: null },
      });
      const validCode = await Promise.any(
        lecturerCodes.map(async (lc) => {
          const match = await bcrypt.compare(accessCode, lc.code);
          return match ? lc : Promise.reject();
        })
      ).catch(() => null);

      if (!validCode) {
        return NextResponse.json(
          { success: false, error: "Invalid access code" },
          { status: 403 }
        );
      }
    }

    // Validate faculty/program exist for students
    if (role === "STUDENT" && facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: facultyId as string },
      });
      if (!faculty) {
        return NextResponse.json(
          { success: false, error: "Invalid faculty" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userReferralCode = generateReferralCode();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        studentId: studentId || null,
        facultyId: (role === "STUDENT" && facultyId ? facultyId : null) as string | null,
        semester: role === "STUDENT" && semester ? Number(semester) : null,
        programId: (role === "STUDENT" && programId ? programId : null) as string | null,
        referralCode: userReferralCode,
        termsAccepted: termsAccepted === true,
        privacyAccepted: privacyAccepted === true,
        tokenBalance: {
          create: {},
        },
      },
    });

    // Handle referral if provided
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (referrer) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            refereeId: user.id,
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
