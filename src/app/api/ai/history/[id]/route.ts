import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;

    const messages = await prisma.aIInteraction.findMany({
      where: {
        userId: session.user.id,
        conversationId,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        query: true,
        response: true,
        sourceContentIds: true,
        learningLevel: true,
        satisfactionRating: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("AI conversation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;

    // Verify the conversation belongs to this user
    const exists = await prisma.aIInteraction.findFirst({
      where: { userId: session.user.id, conversationId },
      select: { id: true },
    });

    if (!exists) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    await prisma.aIInteraction.deleteMany({
      where: {
        userId: session.user.id,
        conversationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI delete conversation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
