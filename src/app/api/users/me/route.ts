import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { deleteAccountSchema } from "@/lib/validators/account";

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify password (skip for OAuth-only users who have no password)
    if (user.password) {
      const validPassword = await bcrypt.compare(parsed.data.password, user.password);
      if (!validPassword) {
        return NextResponse.json(
          { success: false, error: "Incorrect password" },
          { status: 401 }
        );
      }
    }

    // Soft delete with grace period
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Send confirmation email
    if (user.email) {
      try {
        const settings = await prisma.appSettings.findFirst({
          select: { universityName: true, domain: true },
        });
        const appName = settings?.universityName ?? "UniNotepad";

        const { resend } = await import("@/lib/resend");
        await resend.emails.send({
          from: `${appName} <noreply@${settings?.domain ?? "uninotepad.com"}>`,
          to: user.email,
          subject: "Account Deletion Requested",
          html: `
            <h2>Account Deletion Requested</h2>
            <p>Hi ${user.name ?? "there"},</p>
            <p>Your account deletion has been requested. Your account and all associated data will be permanently deleted in <strong>7 days</strong>.</p>
            <p>If you did not request this or want to cancel, log in and visit your Settings page to cancel the deletion.</p>
            <p>After 7 days, this action cannot be undone.</p>
            <p>— ${appName}</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send deletion confirmation email:", emailError);
      }
    }

    await createAuditLog({
      userId,
      action: "user.deletion_requested",
      entityType: "user",
      entityId: userId,
      metadata: { reason: parsed.data.reason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process account deletion" },
      { status: 500 }
    );
  }
}
