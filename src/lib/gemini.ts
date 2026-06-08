import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

export function getGeminiModel(systemInstruction: string) {
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada no .env.local');

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    systemInstruction,
  });
}
