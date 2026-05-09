import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all content visible to this student (matching their faculty/semester)
    const content = await prisma.content.findMany({
      where: {
        facultyId: session.user.facultyId || undefined,
        semester: {
          in: [session.user.semester || 1],
        },
        status: "ACTIVE",
      },
      include: {
        faculty: { select: { name: true } },
        program: { select: { name: true } },
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
          semester: item.semester,
          materials: [],
        });
      }
      const collection = collections.get(key)!;
      collection.materialCount++;
      collection.materials.push(item);
    });

    const collectionsArray = Array.from(collections.values()).map((col) => ({
      id: col.id,
      module: col.module,
      category: col.category,
      materialCount: col.materialCount,
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
