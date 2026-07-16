import { NextResponse } from "next/server";

import { openai } from "../../../lib/openai";

const SUPPORTED_LANGUAGES = ["en", "ko", "ja"];
const MAX_TEXT_LENGTH = 4000;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const contentKey = body?.contentKey;
    const originalText = body?.originalText;
    const sourceLanguage = body?.sourceLanguage;
    const targetLanguage = body?.targetLanguage;

    if (!isNonEmptyString(contentKey)) {
      return NextResponse.json({ error: "contentKey is required." }, { status: 400 });
    }

    if (!isNonEmptyString(originalText)) {
      return NextResponse.json({ error: "originalText is required." }, { status: 400 });
    }

    if (!isNonEmptyString(sourceLanguage) || !validateLanguage(sourceLanguage)) {
      return NextResponse.json({ error: "Unsupported source language." }, { status: 400 });
    }

    if (!isNonEmptyString(targetLanguage) || !validateLanguage(targetLanguage)) {
      return NextResponse.json({ error: "Unsupported target language." }, { status: 400 });
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({ translatedText: originalText, cached: true });
    }

    if (String(originalText).trim().length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Text is too long to translate." }, { status: 400 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5.6";

    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content: `Translate the provided text into ${targetLanguage}. Preserve tone, paragraph breaks, names, titles, URLs, and formatting. Respond entirely in the user's selected language. Return only the translated text, without commentary, explanation, or summary.`,
        },
        {
          role: "user",
          content: `Source language: ${sourceLanguage}\n\n${originalText}`,
        },
      ],
    });

    const translatedText =
      response?.output_text ||
      response?.output?.[0]?.content?.[0]?.text ||
      "";

    if (!translatedText) {
      return NextResponse.json({ error: "Translation failed." }, { status: 500 });
    }

    return NextResponse.json({ translatedText, cached: false });
  } catch (error) {
    console.error("Translate route error:", error);
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
