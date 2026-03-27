import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export function getModel(modelName?: string) {
  return genAI.getGenerativeModel({
    model: modelName || process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });
}

export { genAI };
