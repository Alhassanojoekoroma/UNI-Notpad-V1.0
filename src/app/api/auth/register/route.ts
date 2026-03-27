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

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userReferralCode = generateReferralCode();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        studentId: studentId || null,
        referralCode: userReferralCode,
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
