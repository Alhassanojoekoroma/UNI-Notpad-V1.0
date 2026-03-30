import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validators/message";
import { createNotification } from "@/lib/notifications";

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
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = 20;

    // Get IDs of users who blocked this user
    const blockedByIds = await prisma.userBlock.findMany({
      where: { blockedId: session.user.id },
      select: { blockerId: true },
    });
    const excludeIds = blockedByIds.map((b) => b.blockerId);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          recipientId: session.user.id,
          senderId: { notIn: excludeIds },
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.message.count({
        where: {
          recipientId: session.user.id,
          senderId: { notIn: excludeIds },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { recipientId, subject, body: msgBody } = parsed.data;

    // Check recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Check blocks in both directions
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: recipientId },
          { blockerId: recipientId, blockedId: session.user.id },
        ],
      },
    });

    if (block) {
      return NextResponse.json(
        { success: false, error: "Cannot send message to this user" },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        subject,
        body: msgBody,
      },
    });

    await createNotification(
      recipientId,
      "MESSAGE_RECEIVED",
      "New Message",
      `${session.user.name ?? "Someone"}: ${subject}`,
      "message",
      message.id
    );

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
