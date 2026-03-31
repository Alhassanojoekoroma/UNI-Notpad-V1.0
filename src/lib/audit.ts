import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface CreateAuditLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  metadata,
  ipAddress,
}: CreateAuditLogParams) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
      ipAddress,
    },
  });
}
