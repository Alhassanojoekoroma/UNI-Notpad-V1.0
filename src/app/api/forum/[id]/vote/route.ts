import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessFaculty, forbidden, requireUser } from "@/lib/rbac";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

    const { id: postId } = await params;
    const userId = guard.user.id;

    const targetPost = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { facultyId: true },
    });
    if (!targetPost) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }
    if (!canAccessFaculty(guard.user, targetPost.facultyId)) {
      return forbidden("You cannot vote in another faculty's forum.");
    }

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
