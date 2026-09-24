import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { purgeDeletedUsers } from "@/lib/purge-deleted-users";

export async function POST() {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    const purgedCount = await purgeDeletedUsers();

    return NextResponse.json({
      success: true,
      data: { purgedCount },
    });
  } catch (error) {
    console.error("Purge error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to purge deleted users" },
      { status: 500 }
    );
  }
}
