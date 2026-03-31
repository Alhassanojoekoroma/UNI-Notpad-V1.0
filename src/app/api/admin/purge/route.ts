import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { purgeDeletedUsers } from "@/lib/purge-deleted-users";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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
