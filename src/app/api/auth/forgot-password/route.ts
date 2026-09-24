import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { clientIp, hit, PASSWORD_RESET_LIMIT } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const limit = hit(clientIp(request), PASSWORD_RESET_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many reset requests. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // Case-insensitive lookup. `findUnique({ where: { email } })` on the raw
    // input silently missed anyone who typed a capital letter, because
    // registration stores the normalised (lowercased) address.
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, name: true },
    });

    // Always report success so this endpoint is not an enumeration oracle.
    if (!user?.email) {
      return NextResponse.json({ success: true });
    }

    const identifier = `password-reset:${user.email.toLowerCase()}`;

    // Invalidate any outstanding reset tokens for this account.
    await prisma.verificationToken.deleteMany({ where: { identifier } });

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: { identifier, token, expires },
    });

    // Previously a TODO sat here, so the UI promised an email that was never
    // sent and locked-out users had no recovery path at all.
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
