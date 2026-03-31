import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import crypto from "crypto";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function purgeDeletedUsers(): Promise<number> {
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

  const usersToPurge = await prisma.user.findMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
    },
    select: { id: true, role: true, email: true },
  });

  if (usersToPurge.length === 0) return 0;

  // Find an admin to reassign lecturer content to
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", deletedAt: null },
    select: { id: true },
  });

  let purgedCount = 0;

  for (const user of usersToPurge) {
    try {
      const anonymizedId = `deleted-${crypto
        .createHash("sha256")
        .update(user.id)
        .digest("hex")
        .slice(0, 8)}`;

      await prisma.$transaction(async (tx) => {
        // Anonymize ContentAccess instead of letting cascade delete it
        await tx.contentAccess.updateMany({
          where: { userId: user.id },
          data: { userId: anonymizedId },
        });

        // Reassign lecturer content to admin (if user is a lecturer and admin exists)
        if (user.role === "LECTURER" && admin) {
          await tx.content.updateMany({
            where: { lecturerId: user.id },
            data: { lecturerId: admin.id },
          });
        }

        // Delete the user — all cascading relations are cleaned up automatically
        await tx.user.delete({ where: { id: user.id } });
      });

      // Audit log outside transaction (non-critical)
      try {
        await createAuditLog({
          userId: admin?.id ?? "system",
          action: "user.purged",
          entityType: "user",
          entityId: user.id,
          metadata: { email: user.email, role: user.role },
        });
      } catch {
        // Audit log failure shouldn't stop purge
      }

      purgedCount++;
    } catch (error) {
      console.error(`Failed to purge user ${user.id}:`, error);
    }
  }

  return purgedCount;
}
