import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { contentScopeFilter, requireUser } from "@/lib/rbac";

const PAGE_SIZE = 30;

const SORTS: Record<string, Prisma.ContentOrderByWithRelationInput> = {
  views: { viewCount: "desc" },
  downloads: { downloadCount: "desc" },
  newest: { createdAt: "desc" },
};

export async function GET(request: Request) {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const moduleFilter = searchParams.get("module");
    const contentType = searchParams.get("contentType");
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

    // Faculty/semester isolation comes from the shared RBAC filter.
    //
    // This used to read `where.facultyId = session.user.facultyId` directly.
    // When that claim was null, Prisma dropped the key entirely and the query
    // returned every faculty's content instead of none — a silent isolation
    // failure for any user without a resolved faculty.
    const where: Prisma.ContentWhereInput = {
      ...(contentScopeFilter(guard.user) as Prisma.ContentWhereInput),
    };

    // Admins see all statuses; everyone else only active material.
    if (guard.user.role !== "ADMIN") where.status = "ACTIVE";

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { module: { contains: search, mode: "insensitive" } },
      ];
    }
    if (moduleFilter) where.module = moduleFilter;
    if (contentType) {
      where.contentType = contentType as Prisma.ContentWhereInput["contentType"];
    }

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          faculty: { select: { name: true } },
          lecturer: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: SORTS[sort] ?? SORTS.newest,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: content,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
