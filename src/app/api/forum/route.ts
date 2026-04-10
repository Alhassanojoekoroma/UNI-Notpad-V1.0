import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createForumPostSchema } from "@/lib/validators/forum";
import { createNotification } from "@/lib/notifications";
import { stripHtmlTags } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const module = searchParams.get("module");
    // Students can only access their own faculty's forum
    const facultyId =
      session.user.role === "STUDENT"
        ? session.user.facultyId
        : (searchParams.get("facultyId") ?? session.user.facultyId);
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: "Faculty ID is required" },
        { status: 400 }
      );
    }

    // If no module param, return module listing with post counts
    if (!module) {
      const modules = await prisma.forumPost.groupBy({
        by: ["module"],
        where: { facultyId, parentId: null },
        _count: true,
      });

      return NextResponse.json({
        success: true,
        data: modules.map((m) => ({
          module: m.module,
          postCount: m._count,
        })),
        type: "module_list",
      });
    }

    // Return paginated top-level posts for a module
    const where = { module, facultyId, parentId: null };

    const orderBy =
      sort === "popular"
        ? [
            { isPinned: "desc" as const },
            { upvoteCount: "desc" as const },
            { createdAt: "desc" as const },
          ]
        : [
            { isPinned: "desc" as const },
            { createdAt: "desc" as const },
          ];

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          module: true,
          title: true,
          body: true,
          isPinned: true,
          upvoteCount: true,
          isAcceptedAnswer: true,
          createdAt: true,
          author: {
            select: { id: true, name: true, avatarUrl: true, role: true },
          },
          _count: { select: { replies: true } },
          votes: {
            where: { userId: session.user.id },
            select: { id: true },
          },
        },
      }),
      prisma.forumPost.count({ where }),
    ]);

    const data = posts.map((post) => ({
      ...post,
      hasVoted: post.votes.length > 0,
      replyCount: post._count.replies,
      votes: undefined,
      _count: undefined,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Forum GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch forum data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createForumPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { module, facultyId, title, body: rawBody, parentId } = parsed.data;
    const postBody = stripHtmlTags(rawBody);

    // If reply, verify parent exists in same module
    if (parentId) {
      const parent = await prisma.forumPost.findUnique({
        where: { id: parentId },
        select: { id: true, module: true, facultyId: true, authorId: true },
      });

      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Parent post not found" },
          { status: 404 }
        );
      }

      if (parent.module !== module || parent.facultyId !== facultyId) {
        return NextResponse.json(
          { success: false, error: "Reply must be in the same module" },
          { status: 400 }
        );
      }

      const post = await prisma.forumPost.create({
        data: {
          module,
          facultyId,
          authorId: session.user.id,
          body: postBody,
          parentId,
        },
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true, role: true },
          },
        },
      });

      // Notify parent post author
      if (parent.authorId !== session.user.id) {
        await createNotification(
          parent.authorId,
          "SYSTEM",
          "New reply to your post",
          `${session.user.name ?? "Someone"} replied to your forum post.`,
          "FORUM_POST",
          parentId
        );
      }

      return NextResponse.json({ success: true, data: post }, { status: 201 });
    }

    // Top-level post
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required for new posts" },
        { status: 400 }
      );
    }

    const post = await prisma.forumPost.create({
      data: {
        module,
        facultyId,
        authorId: session.user.id,
        title,
        body: postBody,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error("Forum POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
