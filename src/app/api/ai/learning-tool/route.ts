import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { learningToolSchema } from "@/lib/validators/ai";
import { checkAndDeductAIQuery } from "@/lib/ai-rate-limit";
import {
  getGeminiClient,
  fetchSourceContent,
  buildStudyGuidePrompt,
  buildMCQPrompt,
  buildFillBlanksPrompt,
  buildMatchingPrompt,
  buildTrueFalsePrompt,
  buildConceptExplainerPrompt,
  buildStudyPlanPrompt,
  buildExamPrepPrompt,
  buildNoteSummaryPrompt,
} from "@/lib/gemini";
import crypto from "crypto";

const promptBuilders: Record<
  string,
  (topic: string | undefined, sources: Awaited<ReturnType<typeof fetchSourceContent>>, level?: string) => string
> = {
  study_guide: buildStudyGuidePrompt,
  quiz_mcq: buildMCQPrompt,
  fill_blanks: buildFillBlanksPrompt,
  matching: buildMatchingPrompt,
  true_false: buildTrueFalsePrompt,
  concept_explainer: buildConceptExplainerPrompt,
  study_plan: buildStudyPlanPrompt,
  exam_prep: buildExamPrepPrompt,
  note_summary: buildNoteSummaryPrompt,
};

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
    const parsed = learningToolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { toolType, sourceContentIds, topic, learningLevel } = parsed.data;

    // Rate limit check
    const rateLimit = await checkAndDeductAIQuery(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimit.reason,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // Audio overview is handled by a separate endpoint
    if (toolType === "audio_overview") {
      return NextResponse.json(
        { success: false, error: "Use /api/ai/audio for audio overview" },
        { status: 400 }
      );
    }

    const sources = await fetchSourceContent(sourceContentIds);
    if (!sources.length) {
      return NextResponse.json(
        { success: false, error: "No valid source content found" },
        { status: 400 }
      );
    }

    // Build prompt
    const buildPrompt = promptBuilders[toolType];
    if (!buildPrompt) {
      return NextResponse.json(
        { success: false, error: "Unknown tool type" },
        { status: 400 }
      );
    }

    const systemPrompt = buildPrompt(topic, sources, learningLevel);

    // Generate content (non-streaming for structured output)
    const model = await getGeminiClient();
    const startTime = Date.now();

    const result = await model.generateContent({
      systemInstruction: systemPrompt,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: topic
                ? `Generate ${toolType.replace(/_/g, " ")} about: ${topic}`
                : `Generate ${toolType.replace(/_/g, " ")} from the provided source materials`,
            },
          ],
        },
      ],
    });

    const responseText = result.response.text();
    const responseTimeMs = Date.now() - startTime;

    // Save interaction
    const interaction = await prisma.aIInteraction.create({
      data: {
        userId: session.user.id,
        conversationId: crypto.randomUUID(),
        query: `[${toolType}] ${topic || "From source materials"}`,
        response: responseText,
        sourceContentIds,
        queryType: toolType,
        learningLevel: learningLevel || null,
        responseTimeMs,
        tokensUsed: 1,
      },
    });

    // Parse structured output for quiz types
    const isQuizType = ["quiz_mcq", "true_false", "fill_blanks", "matching"].includes(toolType);
    let structuredData = null;

    if (isQuizType) {
      try {
        // Strip markdown code fences if present
        const cleaned = responseText
          .replace(/^```(?:json)?\s*/m, "")
          .replace(/\s*```\s*$/m, "")
          .trim();
        structuredData = JSON.parse(cleaned);
      } catch {
        // If JSON parsing fails, return raw text — the client can handle it
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        toolType,
        content: responseText,
        structured: structuredData,
        interactionId: interaction.id,
      },
    });
  } catch (error) {
    console.error("Learning tool error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
