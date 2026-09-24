import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessFaculty, forbidden, requireUser } from "@/lib/rbac";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

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
          where: { userId: guard.user.id },
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
              where: { userId: guard.user.id },
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

    if (!canAccessFaculty(guard.user, post.facultyId)) {
      return forbidden("You cannot access another faculty's forum.");
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
