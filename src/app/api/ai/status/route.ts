import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIQueryStatus } from "@/lib/ai-rate-limit";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const status = await getAIQueryStatus(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        freeRemaining: status.freeRemaining,
        resetAt: status.resetAt?.toISOString() ?? null,
        tokenBalance: status.tokenBalance,
      },
    });
  } catch (error) {
    console.error("AI status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
