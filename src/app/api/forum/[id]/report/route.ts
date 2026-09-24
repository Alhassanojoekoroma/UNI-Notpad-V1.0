import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { reportForumPostSchema } from "@/lib/validators/forum";
import { canAccessFaculty, forbidden, requireUser } from "@/lib/rbac";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

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
      select: { authorId: true, facultyId: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    if (!canAccessFaculty(guard.user, post.facultyId)) {
      return forbidden("You cannot report a post from another faculty.");
    }

    if (post.authorId === guard.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot report your own post" },
        { status: 400 }
      );
    }

    const report = await prisma.userReport.create({
      data: {
        reportedUserId: post.authorId,
        reporterId: guard.user.id,
        reason: parsed.data.reason,
        context: postId,
      },
    });

    await createAuditLog({
      userId: guard.user.id,
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
