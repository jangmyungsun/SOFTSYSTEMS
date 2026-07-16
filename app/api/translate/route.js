import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { openai } from "../../../lib/openai";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const SUPPORTED_LANGUAGES = ["en", "ko"];
const MAX_TEXT_LENGTH = 20000;
const MAX_CHUNK_LENGTH = 3200;
const CHUNK_CONCURRENCY = 2;
const TABLE_NAME = "translation_cache";

function normalizeLanguage(value) {
  const text = String(value || "").toLowerCase();

  if (text.startsWith("ko")) {
    return "ko";
  }

  if (text.startsWith("en")) {
    return "en";
  }

  return "";
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value);
}

function makeTextHash(originalText) {
  return createHash("sha256").update(String(originalText || "")).digest("hex");
}

function splitIntoParagraphChunks(text, maxLength = MAX_CHUNK_LENGTH) {
  const normalized = String(text || "");
  if (!normalized.trim()) {
    return [];
  }

  const paragraphs = normalized.split(/(\n\s*\n+)/);
  const chunks = [];
  let current = "";

  const pushCurrent = () => {
    if (current) {
      chunks.push(current);
      current = "";
    }
  };

  for (const part of paragraphs) {
    if (!part) {
      continue;
    }

    if (part.length > maxLength) {
      pushCurrent();

      let start = 0;
      while (start < part.length) {
        const end = Math.min(start + maxLength, part.length);
        chunks.push(part.slice(start, end));
        start = end;
      }

      continue;
    }

    if ((current + part).length <= maxLength) {
      current += part;
      continue;
    }

    pushCurrent();
    current = part;
  }

  pushCurrent();
  return chunks;
}

async function translateChunk({ chunkText, sourceLanguage, targetLanguage, model }) {
  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "system",
        content: `Translate the provided text into ${targetLanguage}. Preserve tone, paragraph breaks, names, titles, URLs, and formatting. Respond entirely in the user's selected language. Return only the translated text, without commentary, explanation, or summary.`,
      },
      {
        role: "user",
        content: `Source language: ${sourceLanguage}\n\n${chunkText}`,
      },
    ],
  });

  return response?.output_text || response?.output?.[0]?.content?.[0]?.text || "";
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function readServerCache({ contentKey, textHash, sourceLanguage, targetLanguage }) {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select("translated_text")
    .eq("content_key", contentKey)
    .eq("text_hash", textHash)
    .eq("source_language", sourceLanguage)
    .eq("target_language", targetLanguage)
    .maybeSingle();

  if (error) {
    console.warn("translate cache read miss", {
      contentKey,
      targetLanguage,
      message: error.message,
    });
    return "";
  }

  return isNonEmptyString(data?.translated_text) ? data.translated_text : "";
}

async function writeServerCache({ contentKey, textHash, sourceLanguage, targetLanguage, translatedText }) {
  const { error } = await supabaseAdmin.from(TABLE_NAME).upsert(
    {
      content_key: contentKey,
      text_hash: textHash,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      translated_text: translatedText,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "content_key,text_hash,source_language,target_language",
    }
  );

  if (error) {
    console.warn("translate cache write failed", {
      contentKey,
      targetLanguage,
      message: error.message,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const contentKey = body?.contentKey;
    const originalText = body?.originalText;
    const sourceLanguage = normalizeLanguage(body?.sourceLanguage);
    const targetLanguage = normalizeLanguage(body?.targetLanguage);

    if (!isNonEmptyString(contentKey)) {
      return NextResponse.json({ error: "contentKey is required." }, { status: 400 });
    }

    if (!isNonEmptyString(originalText)) {
      return NextResponse.json({ error: "originalText is required." }, { status: 400 });
    }

    if (!validateLanguage(sourceLanguage)) {
      return NextResponse.json({ error: "Unsupported source language." }, { status: 400 });
    }

    if (!validateLanguage(targetLanguage)) {
      return NextResponse.json({ error: "Unsupported target language." }, { status: 400 });
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({ translatedText: originalText, cached: true });
    }

    if (String(originalText).trim().length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Text is too long to translate." }, { status: 400 });
    }

    const trimmedText = String(originalText);
    const textHash = makeTextHash(trimmedText);

    const cachedText = await readServerCache({
      contentKey,
      textHash,
      sourceLanguage,
      targetLanguage,
    });

    if (cachedText) {
      console.info("translate cache hit", {
        contentKey,
        sourceLength: trimmedText.length,
        targetLanguage,
      });

      return NextResponse.json({ translatedText: cachedText, cached: true });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5.6";

    const chunks = splitIntoParagraphChunks(trimmedText, MAX_CHUNK_LENGTH);
    if (!chunks.length) {
      return NextResponse.json({ error: "originalText is required." }, { status: 400 });
    }

    console.info("translate cache miss", {
      contentKey,
      sourceLength: trimmedText.length,
      chunkCount: chunks.length,
      targetLanguage,
    });

    const translatedChunks = await mapWithConcurrency(chunks, CHUNK_CONCURRENCY, async (chunkText) => {
      return translateChunk({ chunkText, sourceLanguage, targetLanguage, model });
    });

    const translatedText = translatedChunks.join("");

    if (!translatedText) {
      return NextResponse.json({ error: "Translation failed." }, { status: 500 });
    }

    await writeServerCache({
      contentKey,
      textHash,
      sourceLanguage,
      targetLanguage,
      translatedText,
    });

    return NextResponse.json({ translatedText, cached: false });
  } catch (error) {
    console.error("Translate route error", {
      message: error?.message || "unknown",
    });
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
