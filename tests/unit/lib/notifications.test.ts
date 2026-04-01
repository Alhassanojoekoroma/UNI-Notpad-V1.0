import { describe, it, expect, vi, beforeEach } from "vitest";

// Unmock notifications so we test the real implementation (prisma is still mocked)
vi.unmock("@/lib/notifications");

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createNotification", () => {
  it("creates a notification with all fields", async () => {
    const mockNotification = { id: "notif-1" };
    mockPrisma.notification.create.mockResolvedValue(mockNotification);

    const result = await createNotification(
      "user-1",
      "MESSAGE" as never,
      "New Message",
      "You have a new message",
      "message",
      "msg-1"
    );

    expect(result).toEqual(mockNotification);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "MESSAGE",
        title: "New Message",
        body: "You have a new message",
        referenceType: "message",
        referenceId: "msg-1",
      },
    });
  });

  it("creates a notification without optional fields", async () => {
    mockPrisma.notification.create.mockResolvedValue({ id: "notif-2" });

    await createNotification(
      "user-1",
      "SYSTEM" as never,
      "Welcome",
      "Welcome to UniNotepad"
    );

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "SYSTEM",
        title: "Welcome",
        body: "Welcome to UniNotepad",
        referenceType: undefined,
        referenceId: undefined,
      },
    });
  });
});
