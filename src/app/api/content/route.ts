import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const search = searchParams.get("search");
    const module = searchParams.get("module");
    const contentType = searchParams.get("contentType");
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = 30;

    // Faculty/semester isolation — enforced server-side
    const where: Record<string, unknown> = {
      facultyId: session.user.facultyId,
      semester: session.user.semester,
      status: "ACTIVE",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { module: { contains: search, mode: "insensitive" } },
      ];
    }
    if (module) where.module = module;
    if (contentType) where.contentType = contentType;

    const orderBy: Record<string, string> =
      sort === "views"
        ? { viewCount: "desc" }
        : sort === "downloads"
          ? { downloadCount: "desc" }
          : { createdAt: "desc" };

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          faculty: { select: { name: true } },
          lecturer: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: content,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
