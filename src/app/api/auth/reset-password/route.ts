import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { BCRYPT_ROUNDS } from "@/lib/constants";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { clientIp, hit, PASSWORD_RESET_LIMIT } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limit = hit(clientIp(request), PASSWORD_RESET_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid input",
        },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (
      !verificationToken ||
      !verificationToken.identifier.startsWith("password-reset:") ||
      verificationToken.expires < new Date()
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const email = verificationToken.identifier.slice("password-reset:".length);
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });

    if (!user) {
      // Token outlived its account — clean it up and refuse.
      await prisma.verificationToken.deleteMany({ where: { token } });
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const changedAt = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        // `passwordChangedAt` invalidates JWTs minted before the reset, so an
        // attacker holding a stolen session is actually signed out.
        data: { password: hashedPassword, passwordChangedAt: changedAt },
      }),
      // Terminate database-backed (OAuth) sessions too.
      prisma.session.deleteMany({ where: { userId: user.id } }),
      // Burn the used token and any siblings for this identifier.
      prisma.verificationToken.deleteMany({
        where: { identifier: verificationToken.identifier },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
