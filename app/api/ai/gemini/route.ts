import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function normalizeAssistantText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*/g, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    const { subject, question } = (await request.json()) as { subject?: string; question?: string };

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured yet." }, { status: 503 });
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const ai = new GoogleGenAI({ apiKey });

    const prompt = [
      "You are a psychology board exam study helper.",
      "Give concise, accurate, student-friendly explanations.",
      "Clarify difficult concepts and suggest retrieval-practice follow-up questions when helpful.",
      "Respond in plain text only. Do not use markdown and do not use asterisks.",
      `Subject: ${subject ?? "General Psychology"}`,
      `Question: ${question.trim()}`
    ].join("\n");

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.4
      }
    });

    const rawAnswer = result.text?.trim();
    const answer = rawAnswer ? normalizeAssistantText(rawAnswer) : "";
    if (!answer) {
      throw new Error("Gemini did not return an answer.");
    }

    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gemini helper is unavailable right now." },
      { status: 500 }
    );
  }
}
