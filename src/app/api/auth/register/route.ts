import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import { BCRYPT_ROUNDS } from "@/lib/constants";
import { generateReferralCode } from "@/lib/utils";
import { validateStudentId } from "@/lib/student-id";
import { clientIp, hit, REGISTER_LIMIT } from "@/lib/rate-limit";

/**
 * Public student registration.
 *
 * This endpoint creates STUDENT accounts and nothing else. `role` is never read
 * from the request body — previously it was, which let anyone self-assign
 * LECTURER. Lecturer accounts are provisioned at
 * `POST /api/auth/register/lecturer` with an admin-issued single-use code.
 */
export async function POST(request: Request) {
  try {
    const limit = hit(clientIp(request), REGISTER_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many registration attempts. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

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

    const {
      name,
      email,
      password,
      studentId,
      facultyId,
      programId,
      semester,
      referralCode,
    } = parsed.data;

    // Student ID must match the institution's configured format.
    const studentIdError = await validateStudentId(studentId);
    if (studentIdError) {
      return NextResponse.json(
        { success: false, error: studentIdError },
        { status: 400 },
      );
    }

    // Validate the academic selection server-side rather than trusting the
    // client's faculty/program pairing.
    const [faculty, program, existingEmail, existingStudentId] =
      await Promise.all([
        prisma.faculty.findFirst({
          where: { id: facultyId, isActive: true },
          select: { id: true },
        }),
        prisma.program.findFirst({
          where: { id: programId, facultyId, isActive: true },
          select: { id: true },
        }),
        prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
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

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 },
      );
    }

    if (existingStudentId) {
      return NextResponse.json(
        { success: false, error: "Student ID already registered" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Resolve the referrer before the transaction so a bad referral code never
    // aborts account creation.
    const referrer = referralCode
      ? await prisma.user.findUnique({
          where: { referralCode },
          select: { id: true },
        })
      : null;

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
          studentId,
          facultyId,
          semester,
          programId,
          referralCode: generateReferralCode(),
          termsAccepted: true,
          privacyAccepted: true,
          tokenBalance: { create: {} },
        },
        select: { id: true, email: true, role: true },
      });

      if (referrer && referrer.id !== created.id) {
        await tx.referral.create({
          data: { referrerId: referrer.id, refereeId: created.id },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    // Unique-constraint races (two requests for the same email/ID at once)
    // surface as a conflict rather than a 500.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with those details already exists",
        },
        { status: 409 },
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
