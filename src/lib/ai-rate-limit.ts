import { prisma } from "./prisma";

type RateLimitResult =
  | { allowed: true; method: "free" | "token" }
  | { allowed: false; reason: string; resetAt: Date | null };

export async function checkAndDeductAIQuery(
  userId: string
): Promise<RateLimitResult> {
  return prisma.$transaction(async (tx) => {
    const [user, settings] = await Promise.all([
      tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          freeQueriesRemaining: true,
          freeQueriesResetAt: true,
        },
      }),
      tx.appSettings.findFirst({
        select: {
          freeQueriesPerDay: true,
          freeSuspensionHours: true,
        },
      }),
    ]);

    const freeQueriesPerDay = settings?.freeQueriesPerDay ?? 20;
    const freeSuspensionHours = settings?.freeSuspensionHours ?? 7;
    let { freeQueriesRemaining, freeQueriesResetAt } = user;

    // Reset free queries if the suspension period has passed
    if (freeQueriesResetAt && freeQueriesResetAt <= new Date()) {
      freeQueriesRemaining = freeQueriesPerDay;
      freeQueriesResetAt = null;
      await tx.user.update({
        where: { id: userId },
        data: {
          freeQueriesRemaining: freeQueriesPerDay,
          freeQueriesResetAt: null,
        },
      });
    }

    // Try free queries first
    if (freeQueriesRemaining > 0) {
      const newRemaining = freeQueriesRemaining - 1;
      const updateData: { freeQueriesRemaining: number; freeQueriesResetAt?: Date } = {
        freeQueriesRemaining: newRemaining,
      };

      // If this was the last free query, set the suspension reset time
      if (newRemaining === 0) {
        updateData.freeQueriesResetAt = new Date(
          Date.now() + freeSuspensionHours * 60 * 60 * 1000
        );
      }

      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      return { allowed: true, method: "free" as const };
    }

    // Free queries exhausted and still in suspension — try tokens
    const tokenBalance = await tx.tokenBalance.findUnique({
      where: { userId },
    });

    if (tokenBalance && tokenBalance.available > 0) {
      await tx.tokenBalance.update({
        where: { userId },
        data: {
          available: { decrement: 1 },
          used: { increment: 1 },
        },
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: -1,
          type: "USAGE",
          status: "COMPLETED",
          metadata: { action: "ai_query" },
        },
      });

      return { allowed: true, method: "token" as const };
    }

    // No free queries and no tokens
    return {
      allowed: false,
      reason:
        "No queries remaining. Purchase tokens or wait for your free queries to reset.",
      resetAt: freeQueriesResetAt,
    };
  });
}

export async function getAIQueryStatus(userId: string) {
  const [user, tokenBalance] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        freeQueriesRemaining: true,
        freeQueriesResetAt: true,
      },
    }),
    prisma.tokenBalance.findUnique({
      where: { userId },
      select: { available: true },
    }),
  ]);

  // Check if reset time has passed (read-only check for UI display)
  let freeRemaining = user.freeQueriesRemaining;
  let resetAt = user.freeQueriesResetAt;

  if (resetAt && resetAt <= new Date()) {
    // Will be reset on next query — show as available for UI
    const settings = await prisma.appSettings.findFirst({
      select: { freeQueriesPerDay: true },
    });
    freeRemaining = settings?.freeQueriesPerDay ?? 20;
    resetAt = null;
  }

  return {
    freeRemaining,
    resetAt,
    tokenBalance: tokenBalance?.available ?? 0,
  };
}
