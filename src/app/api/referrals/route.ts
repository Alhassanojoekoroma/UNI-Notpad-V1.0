import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

/**
 * The signed-in user's referral code and the referrals they have made.
 *
 * The `Referral` model and per-user referral codes have existed since the
 * initial schema and are written at registration — but this endpoint was a
 * `{status:"ok"}` stub and `/referrals` rendered `<div>Referrals</div>`, so the
 * feature was invisible to users.
 */
export async function GET() {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

    const [user, referrals, bonusSetting] = await Promise.all([
      prisma.user.findUnique({
        where: { id: guard.user.id },
        select: { referralCode: true },
      }),
      prisma.referral.findMany({
        where: { referrerId: guard.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          tokensAwarded: true,
          createdAt: true,
          referee: { select: { name: true, createdAt: true } },
        },
      }),
      prisma.appSettings.findFirst({ select: { referralBonusTokens: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user?.referralCode ?? null,
        bonusTokensPerReferral: bonusSetting?.referralBonusTokens ?? 0,
        totalReferrals: referrals.length,
        totalTokensAwarded: referrals.reduce(
          (sum, r) => sum + r.tokensAwarded,
          0,
        ),
        // Referee names only — never their email addresses.
        referrals: referrals.map((r) => ({
          id: r.id,
          status: r.status,
          tokensAwarded: r.tokensAwarded,
          createdAt: r.createdAt,
          refereeName: r.referee?.name ?? "A student",
        })),
      },
    });
  } catch (error) {
    console.error("Referrals fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
