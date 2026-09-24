import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contentRatingSchema } from "@/lib/validators/content";
import { canAccessContent, forbidden, requireUser } from "@/lib/rbac";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = contentRatingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { rating, feedbackText } = parsed.data;

    const content = await prisma.content.findUnique({
      where: { id },
      select: { facultyId: true, semester: true, status: true },
    });
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 },
      );
    }
    if (!canAccessContent(guard.user, content)) {
      return forbidden("Access denied");
    }

    // Upsert the rating
    await prisma.contentRating.upsert({
      where: {
        contentId_userId: { contentId: id, userId: guard.user.id },
      },
      create: {
        contentId: id,
        userId: guard.user.id,
        rating,
        feedbackText,
      },
      update: {
        rating,
        feedbackText,
      },
    });

    // Recalculate average rating
    const avg = await prisma.contentRating.aggregate({
      where: { contentId: id },
      _avg: { rating: true },
    });

    await prisma.content.update({
      where: { id },
      data: { averageRating: avg._avg.rating },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content rating error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
