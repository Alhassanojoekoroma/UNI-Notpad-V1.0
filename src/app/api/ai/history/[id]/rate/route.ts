import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ratingSchema } from "@/lib/validators/ai";

export async function PATCH(
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
    const parsed = ratingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Verify ownership
    const interaction = await prisma.aIInteraction.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!interaction) {
      return NextResponse.json(
        { success: false, error: "Interaction not found" },
        { status: 404 }
      );
    }

    await prisma.aIInteraction.update({
      where: { id },
      data: { satisfactionRating: parsed.data.rating },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI rating error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
