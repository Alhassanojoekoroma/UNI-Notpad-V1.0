import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quizScoreSchema } from "@/lib/validators/ai";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = quizScoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { module, quizType, score, totalQuestions } = parsed.data;

    const quizScore = await prisma.quizScore.create({
      data: {
        userId: session.user.id,
        module,
        quizType,
        score,
        totalQuestions,
      },
    });

    return NextResponse.json({ success: true, data: quizScore });
  } catch (error) {
    console.error("Quiz score error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
