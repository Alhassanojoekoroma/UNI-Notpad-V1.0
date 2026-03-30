import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./prisma";

// Cache AppSettings for 60 seconds to avoid hitting DB on every request
let cachedSettings: {
  geminiApiKey: string | null;
  geminiModel: string;
  timestamp: number;
} | null = null;

const CACHE_TTL = 60_000;

async function getSettings() {
  if (cachedSettings && Date.now() - cachedSettings.timestamp < CACHE_TTL) {
    return cachedSettings;
  }
  const settings = await prisma.appSettings.findFirst();
  cachedSettings = {
    geminiApiKey: settings?.geminiApiKey ?? null,
    geminiModel: settings?.geminiModel ?? "gemini-2.0-flash",
    timestamp: Date.now(),
  };
  return cachedSettings;
}

export async function getGeminiClient() {
  const settings = await getSettings();
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: settings.geminiModel });
}

// Fetch source content metadata for Gemini context
export async function fetchSourceContent(contentIds: string[]) {
  if (!contentIds.length) return [];
  const contents = await prisma.content.findMany({
    where: { id: { in: contentIds } },
    select: {
      id: true,
      title: true,
      module: true,
      moduleCode: true,
      fileUrl: true,
      fileType: true,
      description: true,
    },
  });
  return contents;
}

type SourceContent = Awaited<ReturnType<typeof fetchSourceContent>>[number];

function formatSourceContext(sources: SourceContent[]): string {
  if (!sources.length) return "";
  const items = sources
    .map(
      (s) =>
        `- "${s.title}" (${s.module}${s.moduleCode ? ` [${s.moduleCode}]` : ""}, ${s.fileType.toUpperCase()}): ${s.fileUrl}`
    )
    .join("\n");
  return `\n\nThe student has attached the following course materials as context. Reference them when relevant:\n${items}`;
}

// Build the system prompt for chat
export function buildSystemPrompt(options: {
  learningLevel?: string;
  chatStyle?: string;
  responseLength?: string;
  customInstructions?: string;
  sources?: SourceContent[];
}) {
  const { learningLevel, chatStyle, responseLength, customInstructions, sources } = options;

  let prompt =
    "You are an AI study assistant for university students. You help with understanding course materials, answering academic questions, and supporting learning.";

  if (learningLevel) {
    const levels: Record<string, string> = {
      beginner:
        "Explain concepts simply, avoid jargon, use analogies and examples. Assume minimal prior knowledge.",
      intermediate:
        "Use standard academic language. Assume familiarity with fundamentals. Focus on connections between concepts.",
      advanced:
        "Use technical terminology freely. Go deeper into nuances, edge cases, and advanced applications.",
    };
    prompt += `\n\nLearning level: ${learningLevel}. ${levels[learningLevel] || ""}`;
  }

  if (chatStyle === "learning_guide") {
    prompt +=
      "\n\nAct as a patient tutor. Ask follow-up questions to check understanding. Break complex topics into steps. Encourage the student.";
  } else if (chatStyle === "custom" && customInstructions) {
    prompt += `\n\nCustom instructions from the student: ${customInstructions}`;
  }

  if (responseLength === "shorter") {
    prompt += "\n\nKeep responses concise — aim for 2-3 paragraphs maximum.";
  } else if (responseLength === "longer") {
    prompt += "\n\nProvide thorough, detailed responses with examples and explanations.";
  }

  if (sources?.length) {
    prompt += formatSourceContext(sources);
  }

  return prompt;
}

// Learning tool prompt builders — each returns a system prompt string

export function buildStudyGuidePrompt(
  topic: string | undefined,
  sources: SourceContent[],
  level?: string
) {
  return `You are an academic study guide generator. Create a comprehensive study guide${topic ? ` on "${topic}"` : ""} based on the provided course materials.

Structure the guide with:
1. Key Concepts — main ideas with brief explanations
2. Important Terms — definitions
3. Relationships — how concepts connect
4. Summary — a concise overview
5. Review Questions — 5 questions to test understanding

Learning level: ${level || "intermediate"}.
${formatSourceContext(sources)}

Format the output in clear Markdown.`;
}

export function buildMCQPrompt(
  topic: string | undefined,
  sources: SourceContent[],
  level?: string
) {
  return `You are a quiz generator. Create exactly 10 multiple-choice questions${topic ? ` about "${topic}"` : ""} based on the provided course materials.

Learning level: ${level || "intermediate"}.
${formatSourceContext(sources)}

Return ONLY valid JSON in this exact format, no markdown code fences:
{"questions":[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"..."}]}

Each question must have exactly 4 options labeled A-D. The "answer" field must be the letter only (A, B, C, or D).`;
}

export function buildFillBlanksPrompt(
  topic: string | undefined,
  sources: SourceContent[],
  level?: string
) {
  return `You are a fill-in-the-blank exercise generator. Create exactly 10 fill-in-the-blank sentences${topic ? ` about "${topic}"` : ""} based on the provided course materials.

Learning level: ${level || "intermediate"}.
${formatSourceContext(sources)}

Return ONLY valid JSON in this exact format, no markdown code fences:
{"questions":[{"sentence":"The process of ___ converts light energy into chemical energy.","answer":"photosynthesis","explanation":"..."}]}

Use "___" (three underscores) to mark the blank in each sentence.`;
}

export function buildMatchingPrompt(
  topic: string | undefined,
  sources: SourceContent[],
  level?: string
) {
  return `You are a matching exercise generator. Create exactly 8 matching pairs${topic ? ` about "${topic}"` : ""} based on the provided course materials.

Learning level: ${level || "intermediate"}.
${formatSourceContext(sources)}

Return ONLY valid JSON in this exact format, no markdown code fences:
{"pairs":[{"columnA":"Term or concept","columnB":"Its definition or match"}]}

Column A contains terms/concepts, Column B contains definitions/descriptions. The pairs should be shuffled when presented to the student.`;
}

export function buildTrueFalsePrompt(
  topic: string | undefined,
  sources: SourceContent[],
  level?: string
) {
  return `You are a true/false quiz generator. Create exactly 12 true/false statements${topic ? ` about "${topic}"` : ""} based on the provided course materials.

Learning level: ${level || "intermediate"}.
${formatSourceContext(sources)}

Return ONLY valid JSON in this exact format, no markdown code fences:
{"questions":[{"question":"Statement here.","answer":"true","explanation":"..."}]}

The "answer" field must be either "true" or "false" (lowercase). Mix true and false answers roughly evenly.`;
}

export function buildConceptExplainerPrompt(
  concept: string | undefined,
  sources: SourceContent[],
  level?: string
) {
  return `You are a concept explainer for university students. Explain${concept ? ` "${concept}"` : " the main concept from the provided materials"} using this 6-part structure:

1. **Simple Definition** — one-sentence plain-language definition
2. **Detailed Explanation** — 2-3 paragraphs with context
3. **Real-World Example** — a practical or relatable example
4. **Common Misconceptions** — what students often get wrong
5. **How It Connects** — links to related concepts
6. **Memory Aid** — a mnemonic, analogy, or visualization technique

Learning level: ${level || "intermediate"}.
${formatSourceContext(sources)}

Format the output in clear Markdown.`;
}

export function buildStudyPlanPrompt(
  topic: string | undefined,
  sources: SourceContent[],
  deadline?: string
) {
  return `You are a study planner. Create a 2-3 week study plan${topic ? ` for "${topic}"` : ""} based on the provided course materials.

${deadline ? `The exam/deadline is on ${deadline}.` : "Assume the student has 2-3 weeks to prepare."}
${formatSourceContext(sources)}

Structure the plan as:
- **Week-by-week breakdown** with daily study goals
- **Time estimates** for each session (30-90 minutes)
- **Active recall techniques** to use
- **Review checkpoints** to assess progress
- **Rest/break recommendations**

Format the output in clear Markdown.`;
}

export function buildExamPrepPrompt(
  topic: string | undefined,
  sources: SourceContent[],
  level?: string
) {
  return `You are an exam preparation assistant. Create exam preparation material${topic ? ` for "${topic}"` : ""} based on the provided course materials.

Learning level: ${level || "intermediate"}.
${formatSourceContext(sources)}

Include:
1. **Likely Exam Questions** — 8-10 questions covering key topics (mix of short answer and essay)
2. **Model Answers** — brief but complete answers for each
3. **Key Formulas/Facts** — essential items to memorize
4. **Exam Tips** — strategies for the exam itself
5. **Common Mistakes** — pitfalls to avoid

Format the output in clear Markdown.`;
}

export function buildNoteSummaryPrompt(
  topic: string | undefined,
  sources: SourceContent[]
) {
  return `You are a note summarizer. Create concise, well-organized summary notes${topic ? ` for "${topic}"` : ""} based on the provided course materials.
${formatSourceContext(sources)}

Structure:
- **Bullet-point format** — hierarchical with indentation
- **Bold key terms** on first mention
- **Group by topic/section** from the source materials
- Keep it concise — aim for ~30% of the original length
- Include any important formulas, dates, or figures

Format the output in clear Markdown.`;
}

export function buildAudioScriptPrompt(
  sources: SourceContent[],
  narrationStyle: "single" | "conversation"
) {
  const styleInstruction =
    narrationStyle === "conversation"
      ? "Write as a dialogue between two hosts (Host A and Host B) who discuss the material in an engaging, conversational way. They should ask each other questions and build on each other's explanations."
      : "Write as a single narrator giving a clear, engaging lecture-style overview.";

  return `You are a podcast script writer for educational content. Create a 3-4 minute narration script based on the provided course materials.

${styleInstruction}
${formatSourceContext(sources)}

Guidelines:
- Open with a brief introduction of the topic
- Cover the main concepts clearly
- Use transitions between sections
- Close with a brief recap of key takeaways
- Use natural, spoken language (not academic writing)
- Mark speaker changes clearly (e.g., "HOST A:" and "HOST B:" for conversation style)

Return the script as plain text, ready to be read aloud.`;
}
