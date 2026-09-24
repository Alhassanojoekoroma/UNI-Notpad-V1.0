import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

/**
 * AI token balance and transaction history for the signed-in user.
 *
 * Read-only by design: `TokenBalance` and `TokenTransaction` are written by the
 * AI billing path (`lib/ai-rate-limit.ts`), but there is no way to *purchase*
 * tokens because the Monime and Stripe webhooks are unimplemented. See
 * docs/SYSTEM_AUDIT.md → Remaining deployment risks.
 */
export async function GET() {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

    const [balance, transactions, user, settings] = await Promise.all([
      prisma.tokenBalance.findUnique({
        where: { userId: guard.user.id },
        select: { available: true, used: true, total: true, bonus: true },
      }),
      prisma.tokenTransaction.findMany({
        where: { userId: guard.user.id },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: guard.user.id },
        select: { freeQueriesRemaining: true, freeQueriesResetAt: true },
      }),
      prisma.appSettings.findFirst({
        select: { freeQueriesPerDay: true, freeSuspensionHours: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        balance: balance ?? { available: 0, used: 0, total: 0, bonus: 0 },
        transactions,
        freeQueries: {
          remaining: user?.freeQueriesRemaining ?? 0,
          perDay: settings?.freeQueriesPerDay ?? 20,
          resetAt: user?.freeQueriesResetAt ?? null,
          cooldownHours: settings?.freeSuspensionHours ?? 7,
        },
        // Surfaced so the UI can be honest instead of showing a dead buy button.
        purchaseAvailable: false,
      },
    });
  } catch (error) {
    console.error("Tokens fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
