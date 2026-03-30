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

    if (!search || search.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get blocked user IDs
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: session.user.id },
          { blockedId: session.user.id },
        ],
      },
      select: { blockerId: true, blockedId: true },
    });

    const excludeIds = new Set<string>();
    excludeIds.add(session.user.id);
    for (const block of blocks) {
      excludeIds.add(block.blockerId);
      excludeIds.add(block.blockedId);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        isActive: true,
        name: { contains: search, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
      take: 10,
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
