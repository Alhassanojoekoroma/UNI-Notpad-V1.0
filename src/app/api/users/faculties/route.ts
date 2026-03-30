import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [faculties, programs, settings] = await Promise.all([
      prisma.faculty.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      }),
      prisma.program.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true, facultyId: true },
      }),
      prisma.appSettings.findFirst({
        select: { maxSemesters: true, studentIdPattern: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        faculties,
        programs,
        maxSemesters: settings?.maxSemesters ?? 8,
        studentIdPattern: settings?.studentIdPattern ?? "^90500\\d{4,}$",
      },
    });
  } catch (error) {
    console.error("Faculties fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
