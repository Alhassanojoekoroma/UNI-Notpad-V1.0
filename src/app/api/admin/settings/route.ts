import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validators/admin";
import { createAuditLog } from "@/lib/audit";

function maskKey(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.length <= 4) return "****";
  return "****" + key.slice(-4);
}

export async function GET() {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return NextResponse.json({ success: true, data: null });
    }

    // Mask API keys
    const masked = {
      ...settings,
      geminiApiKey: maskKey(settings.geminiApiKey),
      elevenlabsApiKey: maskKey(settings.elevenlabsApiKey),
      resendApiKey: maskKey(settings.resendApiKey),
      monimeApiKey: maskKey(settings.monimeApiKey),
      stripeSecretKey: maskKey(settings.stripeSecretKey),
      cloudinaryApiKey: maskKey(settings.cloudinaryApiKey),
      cloudinaryApiSecret: maskKey(settings.cloudinaryApiSecret),
    };

    return NextResponse.json({ success: true, data: masked });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const data = settingsSchema.parse(body);

    // Filter out masked values (don't overwrite with masked strings)
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && typeof value === "string" && value.startsWith("****")) {
        continue;
      }
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    // `update` threw P2025 (surfacing as an opaque 500) on any database where
    // the setup wizard had not yet created the singleton row.
    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...updateData },
      update: updateData,
    });

    await createAuditLog({
      userId: guard.user.id,
      action: "settings.updated",
      entityType: "settings",
      entityId: "default",
      metadata: { fields: Object.keys(updateData) },
    });

    // Mask API keys before returning
    const maskedResponse = {
      ...updated,
      geminiApiKey: maskKey(updated.geminiApiKey),
      elevenlabsApiKey: maskKey(updated.elevenlabsApiKey),
      resendApiKey: maskKey(updated.resendApiKey),
      monimeApiKey: maskKey(updated.monimeApiKey),
      stripeSecretKey: maskKey(updated.stripeSecretKey),
      cloudinaryApiKey: maskKey(updated.cloudinaryApiKey),
      cloudinaryApiSecret: maskKey(updated.cloudinaryApiSecret),
    };

    return NextResponse.json({ success: true, data: maskedResponse });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
