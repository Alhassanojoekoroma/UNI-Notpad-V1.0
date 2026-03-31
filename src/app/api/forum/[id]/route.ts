import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    const { id } = await params;

    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: {
        id: true,
        module: true,
        facultyId: true,
        title: true,
        body: true,
        isPinned: true,
        upvoteCount: true,
        isAcceptedAnswer: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        parentId: true,
        author: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
        votes: {
          where: { userId: session.user.id },
          select: { id: true },
        },
        replies: {
          orderBy: [
            { isAcceptedAnswer: "desc" },
            { upvoteCount: "desc" },
            { createdAt: "asc" },
          ],
          select: {
            id: true,
            body: true,
            upvoteCount: true,
            isAcceptedAnswer: true,
            createdAt: true,
            authorId: true,
            author: {
              select: { id: true, name: true, avatarUrl: true, role: true },
            },
            votes: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    const data = {
      ...post,
      hasVoted: post.votes.length > 0,
      votes: undefined,
      replies: post.replies.map((reply) => ({
        ...reply,
        hasVoted: reply.votes.length > 0,
        votes: undefined,
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Forum post GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
