import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiQuerySchema } from "@/lib/validators/ai";
import { checkAndDeductAIQuery } from "@/lib/ai-rate-limit";
import {
  getGeminiClient,
  fetchSourceContent,
  buildSystemPrompt,
} from "@/lib/gemini";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const parsed = aiQuerySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid input",
          details: parsed.error.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const {
      query,
      conversationId: existingConversationId,
      sourceContentIds,
      learningLevel,
      chatStyle,
      responseLength,
      customInstructions,
    } = parsed.data;

    // Check rate limit and deduct
    const rateLimit = await checkAndDeductAIQuery(session.user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: rateLimit.reason,
          resetAt: rateLimit.resetAt,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch source content if provided
    const sources = sourceContentIds?.length
      ? await fetchSourceContent(sourceContentIds)
      : [];

    // Build system prompt
    const systemInstruction = buildSystemPrompt({
      learningLevel,
      chatStyle,
      responseLength,
      customInstructions,
      sources,
    });

    // Get conversation history for context
    const conversationId = existingConversationId || crypto.randomUUID();
    let history: { role: string; parts: { text: string }[] }[] = [];

    if (existingConversationId) {
      const previousMessages = await prisma.aIInteraction.findMany({
        where: {
          userId: session.user.id,
          conversationId: existingConversationId,
        },
        orderBy: { createdAt: "asc" },
        take: 10,
        select: { query: true, response: true },
      });

      history = previousMessages.flatMap((msg) => [
        { role: "user", parts: [{ text: msg.query }] },
        { role: "model", parts: [{ text: msg.response }] },
      ]);
    }

    // Call Gemini with streaming
    const model = await getGeminiClient();
    const startTime = Date.now();

    const result = await model.generateContentStream({
      systemInstruction,
      contents: [
        ...history,
        { role: "user", parts: [{ text: query }] },
      ],
    });

    // Create SSE stream
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullResponse += text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "delta", text })}\n\n`
                )
              );
            }
          }

          // Save interaction to DB
          const responseTimeMs = Date.now() - startTime;
          const interaction = await prisma.aIInteraction.create({
            data: {
              userId: session.user.id,
              conversationId,
              query,
              response: fullResponse,
              sourceContentIds: sourceContentIds || [],
              queryType: "chat",
              learningLevel: learningLevel || null,
              responseTimeMs,
              tokensUsed: 1,
            },
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                id: interaction.id,
                conversationId,
              })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream failed";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI query error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
