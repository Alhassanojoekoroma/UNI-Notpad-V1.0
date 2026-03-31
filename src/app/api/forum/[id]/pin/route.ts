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

    // Only lecturers and admins can pin posts
    if (session.user.role !== "LECTURER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only lecturers can pin posts" },
        { status: 403 }
      );
    }

    const { id: postId } = await params;

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, isPinned: true, parentId: true, facultyId: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.parentId) {
      return NextResponse.json(
        { success: false, error: "Only top-level posts can be pinned" },
        { status: 400 }
      );
    }

    // Lecturers can only pin posts in their own faculty
    if (
      session.user.role === "LECTURER" &&
      post.facultyId !== session.user.facultyId
    ) {
      return NextResponse.json(
        { success: false, error: "You can only pin posts in your faculty" },
        { status: 403 }
      );
    }

    const updated = await prisma.forumPost.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
      select: { id: true, isPinned: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Forum pin error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle pin" },
      { status: 500 }
    );
  }
}
