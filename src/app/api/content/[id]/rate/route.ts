import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentRatingSchema } from "@/lib/validators/content";

export async function POST(
  request: Request,
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
    const body = await request.json();
    const parsed = contentRatingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { rating, feedbackText } = parsed.data;

    // Upsert the rating
    await prisma.contentRating.upsert({
      where: {
        contentId_userId: { contentId: id, userId: session.user.id },
      },
      create: {
        contentId: id,
        userId: session.user.id,
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
