import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        faculty: { select: { name: true, code: true } },
        program: { select: { name: true } },
        lecturer: { select: { id: true, name: true, avatarUrl: true } },
        ratings: {
          where: { userId: session.user.id },
          select: { rating: true, feedbackText: true },
        },
      },
    });

    if (!content || content.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Verify faculty/semester match for students
    if (
      session.user.role === "STUDENT" &&
      (content.facultyId !== session.user.facultyId ||
        content.semester !== session.user.semester)
    ) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
