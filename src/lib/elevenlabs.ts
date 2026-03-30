import { prisma } from "./prisma";

let cachedApiKey: { key: string | null; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

async function getApiKey(): Promise<string | null> {
  if (cachedApiKey && Date.now() - cachedApiKey.timestamp < CACHE_TTL) {
    return cachedApiKey.key;
  }
  const settings = await prisma.appSettings.findFirst({
    select: { elevenlabsApiKey: true },
  });
  cachedApiKey = {
    key: settings?.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || null,
    timestamp: Date.now(),
  };
  return cachedApiKey.key;
}

export async function isElevenLabsConfigured(): Promise<boolean> {
  const key = await getApiKey();
  return !!key;
}

export async function generateAudio(
  script: string,
  voiceId?: string
): Promise<ArrayBuffer> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("ElevenLabs API key not configured");

  const voice = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  return response.arrayBuffer();
}

export const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew" },
  { id: "2EiwWnXFnvU5JabPnv8n", name: "Clyde" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
] as const;
