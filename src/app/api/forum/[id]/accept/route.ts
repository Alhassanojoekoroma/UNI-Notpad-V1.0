import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: postId } = await params;

    // Fetch the reply and its parent
    const reply = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        parentId: true,
        parent: { select: { authorId: true } },
      },
    });

    if (!reply) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    if (!reply.parentId || !reply.parent) {
      return NextResponse.json(
        { success: false, error: "Only replies can be accepted as answers" },
        { status: 400 }
      );
    }

    if (reply.parent.authorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Only the original poster can accept answers" },
        { status: 403 }
      );
    }

    // Unaccept any previously accepted answer on the same parent
    await prisma.$transaction([
      prisma.forumPost.updateMany({
        where: { parentId: reply.parentId, isAcceptedAnswer: true },
        data: { isAcceptedAnswer: false },
      }),
      prisma.forumPost.update({
        where: { id: postId },
        data: { isAcceptedAnswer: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept answer error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to accept answer" },
      { status: 500 }
    );
  }
}
