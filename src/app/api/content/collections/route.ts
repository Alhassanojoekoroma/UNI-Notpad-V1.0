import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentScope } from "@/lib/rbac";

export async function GET() {
  try {
    const guard = await requireStudentScope();
    if (!guard.ok) return guard.response;

    // Get all content visible to this student (matching their faculty/semester)
    const content = await prisma.content.findMany({
      where: {
        facultyId: guard.user.facultyId,
        semester: guard.user.semester,
        status: "ACTIVE",
      },
      include: {
        faculty: { select: { name: true } },
        program: { select: { name: true } },
        access: {
          where: { userId: guard.user.id },
          select: { contentId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group content by module (creating collections)
    const collections = new Map<
      string,
      {
        id: string;
        module: string;
        category: string;
        materialCount: number;
        accessedCount: number;
        semester: number;
        materials: typeof content;
      }
    >();

    content.forEach((item) => {
      const key = `${item.module}-${item.semester}`;
      if (!collections.has(key)) {
        collections.set(key, {
          id: key,
          module: item.module,
          category: item.contentType.toLowerCase(),
          materialCount: 0,
          accessedCount: 0,
          semester: item.semester,
          materials: [],
        });
      }
      const collection = collections.get(key)!;
      collection.materialCount++;
      if (item.access.length > 0) collection.accessedCount++;
      collection.materials.push(item);
    });

    const collectionsArray = Array.from(collections.values()).map((col) => ({
      id: col.id,
      module: col.module,
      category: col.category,
      materialCount: col.materialCount,
      progress: Math.round((col.accessedCount / col.materialCount) * 100),
      semester: col.semester,
    }));

    return NextResponse.json({
      success: true,
      data: collectionsArray,
    });
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}
