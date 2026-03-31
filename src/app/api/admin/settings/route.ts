import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const updated = await prisma.appSettings.update({
      where: { id: "default" },
      data: updateData,
    });

    await createAuditLog({
      userId: session.user.id!,
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
        { success: false, error: "Validation failed", details: error },
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
