import { NextResponse } from "next/server";

import { openai } from "../../../lib/openai";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const SUPPORTED_LANGUAGES = ["en", "ko", "ja"];
const MAX_TEXT_LENGTH = 12000;
const CHUNK_SIZE = 3200;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value);
}

function splitTextIntoChunks(text, size = CHUNK_SIZE) {
  const normalized = String(text || "");

  if (normalized.length <= size) {
    return [normalized];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = start + size;

    if (end < normalized.length) {
      const breakPoint = normalized.lastIndexOf("\n\n", end);
      if (breakPoint > start) {
        end = breakPoint;
      }
    }

    chunks.push(normalized.slice(start, end));
    start = end;
  }

  return chunks.filter(Boolean);
}

function buildCacheKey(contentKey, originalText, sourceLanguage, targetLanguage) {
  const hash = Array.from(String(originalText || "")).reduce((accumulator, character) => {
    accumulator = (accumulator << 5) - accumulator + character.charCodeAt(0);
    return accumulator | 0;
  }, 0);

  return `softsystems_content_translation:${contentKey}:${sourceLanguage}:${targetLanguage}:${hash}`;
}

async function getCachedTranslation(contentKey, originalText, sourceLanguage, targetLanguage) {
  try {
    const { data, error } = await supabaseAdmin
      .from("content_translations")
      .select("translated_text")
      .eq("content_key", contentKey)
      .eq("target_language", targetLanguage)
      .eq("source_language", sourceLanguage)
      .eq("source_hash", buildCacheKey(contentKey, originalText, sourceLanguage, targetLanguage))
      .maybeSingle();

    if (error) {
      return null;
    }

    return data?.translated_text || null;
  } catch (error) {
    return null;
  }
}

async function saveCachedTranslation(contentKey, originalText, sourceLanguage, targetLanguage, translatedText) {
  try {
    const sourceHash = buildCacheKey(contentKey, originalText, sourceLanguage, targetLanguage);

    await supabaseAdmin.from("content_translations").upsert(
      {
        content_key: contentKey,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        source_hash: sourceHash,
        translated_text: translatedText,
      },
      { onConflict: "content_key,target_language,source_language,source_hash" }
    );
  } catch (error) {
    // ignore cache persistence failures
  }
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

    const trimmedText = String(originalText).trim();

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Text is too long to translate." }, { status: 400 });
    }

    const cacheKey = buildCacheKey(contentKey, trimmedText, sourceLanguage, targetLanguage);
    const cachedTranslation = await getCachedTranslation(contentKey, trimmedText, sourceLanguage, targetLanguage);

    if (cachedTranslation) {
      return NextResponse.json({ translatedText: cachedTranslation, cached: true, cacheKey });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5.6";

    const chunks = splitTextIntoChunks(trimmedText);
    const translatedChunks = [];

    for (const chunk of chunks) {
      const response = await openai.responses.create({
        model,
        input: [
          {
            role: "system",
            content: `Translate the provided text into ${targetLanguage}. Preserve tone, paragraph breaks, names, titles, URLs, and formatting. Return only the translated text, without commentary, explanation, or summary.`,
          },
          {
            role: "user",
            content: `Source language: ${sourceLanguage}\n\n${chunk}`,
          },
        ],
      });

      const translatedChunk =
        response?.output_text ||
        response?.output?.[0]?.content?.[0]?.text ||
        "";

      if (!translatedChunk) {
        return NextResponse.json({ error: "Translation failed." }, { status: 500 });
      }

      translatedChunks.push(translatedChunk.trim());
    }

    const translatedText = translatedChunks.join("\n\n");

    await saveCachedTranslation(contentKey, trimmedText, sourceLanguage, targetLanguage, translatedText);

    return NextResponse.json({ translatedText, cached: false, cacheKey });
  } catch (error) {
    console.error("Translate route error:", error);
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
