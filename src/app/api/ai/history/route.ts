import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;

    // Get distinct conversations with their latest message
    const conversations = await prisma.aIInteraction.findMany({
      where: { userId: session.user.id },
      distinct: ["conversationId"],
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        conversationId: true,
        query: true,
        createdAt: true,
      },
    });

    // Get message counts for each conversation
    const conversationIds = conversations.map((c) => c.conversationId);
    const counts = await prisma.aIInteraction.groupBy({
      by: ["conversationId"],
      where: {
        userId: session.user.id,
        conversationId: { in: conversationIds },
      },
      _count: { id: true },
      _max: { createdAt: true },
    });

    const countMap = new Map(
      counts.map((c) => [
        c.conversationId,
        { count: c._count.id, updatedAt: c._max.createdAt },
      ])
    );

    const data = conversations.map((c) => ({
      conversationId: c.conversationId,
      title: c.query.slice(0, 100),
      messageCount: countMap.get(c.conversationId)?.count ?? 1,
      createdAt: c.createdAt.toISOString(),
      updatedAt:
        countMap.get(c.conversationId)?.updatedAt?.toISOString() ??
        c.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("AI history error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.aIInteraction.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI clear history error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
