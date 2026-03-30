import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [unreadMessages, upcomingDeadlines, user] = await Promise.all([
      prisma.message.count({
        where: { recipientId: session.user.id, isRead: false },
      }),
      prisma.task.count({
        where: {
          userId: session.user.id,
          status: "PENDING",
          deadline: { gte: now, lte: weekFromNow },
        },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { freeQueriesRemaining: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        unreadMessages,
        upcomingDeadlines,
        freeQueriesRemaining: user?.freeQueriesRemaining ?? 0,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
