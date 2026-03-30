import type { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  referenceType?: string,
  referenceId?: string
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      referenceType,
      referenceId,
    },
  });
}
