import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { reportForumPostSchema } from "@/lib/validators/forum";

export async function POST(
  request: Request,
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
    const body = await request.json();
    const parsed = reportForumPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.authorId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot report your own post" },
        { status: 400 }
      );
    }

    const report = await prisma.userReport.create({
      data: {
        reportedUserId: post.authorId,
        reporterId: session.user.id,
        reason: parsed.data.reason,
        context: postId,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "forum.post_reported",
      entityType: "forum_post",
      entityId: postId,
      metadata: { reportId: report.id },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Forum report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to report post" },
      { status: 500 }
    );
  }
}
