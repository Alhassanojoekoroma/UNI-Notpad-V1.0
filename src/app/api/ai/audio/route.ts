import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audioRequestSchema } from "@/lib/validators/ai";
import { checkAndDeductAIQuery } from "@/lib/ai-rate-limit";
import {
  getGeminiClient,
  fetchSourceContent,
  buildAudioScriptPrompt,
} from "@/lib/gemini";
import {
  generateAudio,
  isElevenLabsConfigured,
} from "@/lib/elevenlabs";
import { randomUUID } from "crypto";

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
    const parsed = audioRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { sourceContentIds, narrationStyle, voiceId } = parsed.data;

    // Validate sources before deducting rate limit
    const sources = await fetchSourceContent(sourceContentIds);
    if (!sources.length) {
      return NextResponse.json(
        { success: false, error: "No valid source content found" },
        { status: 400 }
      );
    }

    // Rate limit check — deduct only after validation
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

    // Generate script via Gemini
    const model = await getGeminiClient();
    const startTime = Date.now();
    const systemPrompt = buildAudioScriptPrompt(sources, narrationStyle);

    const result = await model.generateContent({
      systemInstruction: systemPrompt,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Generate the audio overview script based on the provided course materials.",
            },
          ],
        },
      ],
    });

    const script = result.response.text();
    const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 1;
    const responseTimeMs = Date.now() - startTime;

    // Try ElevenLabs TTS if configured
    let audioBase64: string | null = null;
    const hasElevenLabs = await isElevenLabsConfigured();

    if (hasElevenLabs) {
      try {
        const audioBuffer = await generateAudio(script, voiceId);
        audioBase64 = Buffer.from(audioBuffer).toString("base64");
      } catch (error) {
        console.error("ElevenLabs TTS error:", error);
        // Fall through to return script-only
      }
    }

    // Save interaction
    const interaction = await prisma.aIInteraction.create({
      data: {
        userId: session.user.id,
        conversationId: randomUUID(),
        query: `[audio_overview] ${narrationStyle} narration`,
        response: script,
        sourceContentIds,
        queryType: "audio_overview",
        responseTimeMs,
        tokensUsed,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        script,
        audioBase64,
        interactionId: interaction.id,
      },
    });
  } catch (error) {
    console.error("Audio overview error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
