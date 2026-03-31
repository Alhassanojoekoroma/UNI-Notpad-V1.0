import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    const userId = session.user.id;

    const existing = await prisma.forumVote.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      // Remove vote
      await prisma.$transaction([
        prisma.forumVote.delete({
          where: { postId_userId: { postId, userId } },
        }),
        prisma.forumPost.update({
          where: { id: postId },
          data: { upvoteCount: { decrement: 1 } },
        }),
      ]);

      const post = await prisma.forumPost.findUnique({
        where: { id: postId },
        select: { upvoteCount: true },
      });

      return NextResponse.json({
        success: true,
        data: { voted: false, upvoteCount: post?.upvoteCount ?? 0 },
      });
    }

    // Add vote
    await prisma.$transaction([
      prisma.forumVote.create({
        data: { postId, userId },
      }),
      prisma.forumPost.update({
        where: { id: postId },
        data: { upvoteCount: { increment: 1 } },
      }),
    ]);

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { upvoteCount: true },
    });

    return NextResponse.json({
      success: true,
      data: { voted: true, upvoteCount: post?.upvoteCount ?? 0 },
    });
  } catch (error) {
    console.error("Forum vote error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle vote" },
      { status: 500 }
    );
  }
}
