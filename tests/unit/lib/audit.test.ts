import { describe, it, expect, vi, beforeEach } from "vitest";

// Unmock audit so we test the real implementation (prisma is still mocked)
vi.unmock("@/lib/audit");

import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createAuditLog", () => {
  it("creates an audit log entry with all fields", async () => {
    const mockLog = { id: "audit-1" };
    mockPrisma.auditLog.create.mockResolvedValue(mockLog);

    const result = await createAuditLog({
      userId: "admin-1",
      action: "USER_SUSPENDED",
      entityType: "User",
      entityId: "user-1",
      metadata: { reason: "Spam" },
      ipAddress: "127.0.0.1",
    });

    expect(result).toEqual(mockLog);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "admin-1",
        action: "USER_SUSPENDED",
        entityType: "User",
        entityId: "user-1",
        metadata: { reason: "Spam" },
        ipAddress: "127.0.0.1",
      },
    });
  });

  it("creates an audit log without optional fields", async () => {
    mockPrisma.auditLog.create.mockResolvedValue({ id: "audit-2" });

    await createAuditLog({
      userId: "admin-1",
      action: "SETTINGS_UPDATED",
      entityType: "AppSettings",
      entityId: "settings-1",
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "admin-1",
        action: "SETTINGS_UPDATED",
        entityType: "AppSettings",
        entityId: "settings-1",
        metadata: undefined,
        ipAddress: undefined,
      },
    });
  });
});
