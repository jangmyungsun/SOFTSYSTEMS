import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { openai } from "../../../lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing."
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function isValidObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function cleanLogForAI(log) {
  return {
    date: log.date || "",
    pace: log.pace || "",
    state: isValidObject(log.state)
      ? log.state
      : {},
    movement: isValidObject(log.movement)
      ? log.movement
      : {},
    environment: isValidObject(log.environment)
      ? log.environment
      : {},
    work: isValidObject(log.work)
      ? log.work
      : {},
    learning: Array.isArray(log.learning)
      ? log.learning
      : [],
    artistic_input: isValidObject(
      log.artistic_input
    )
      ? log.artistic_input
      : {},
    observation: log.observation || "",
    alignment: log.alignment || "",
    tomorrow: Array.isArray(log.tomorrow)
      ? log.tomorrow
      : [],
  };
}

function validateAnalysis(value) {
  if (!isValidObject(value)) {
    return null;
  }

  if (
    typeof value.summary !== "string" ||
    !value.summary.trim()
  ) {
    return null;
  }

  return {
    summary: value.summary.trim(),

    relationship:
      typeof value.relationship === "string"
        ? value.relationship.trim()
        : "",

    emotions: Array.isArray(value.emotions)
      ? value.emotions
          .filter(
            (item) =>
              typeof item === "string" &&
              item.trim()
          )
          .map((item) => item.trim())
          .slice(0, 6)
      : [],

    themes: Array.isArray(value.themes)
      ? value.themes
          .filter(
            (item) =>
              typeof item === "string" &&
              item.trim()
          )
          .map((item) => item.trim())
          .slice(0, 6)
      : [],

    keywords: Array.isArray(value.keywords)
      ? value.keywords
          .filter(
            (item) =>
              typeof item === "string" &&
              item.trim()
          )
          .map((item) => item.trim())
          .slice(0, 8)
      : [],

    body_signals: Array.isArray(
      value.body_signals
    )
      ? value.body_signals
          .filter(
            (item) =>
              typeof item === "string" &&
              item.trim()
          )
          .map((item) => item.trim())
          .slice(0, 6)
      : [],

    practice_signals: Array.isArray(
      value.practice_signals
    )
      ? value.practice_signals
          .filter(
            (item) =>
              typeof item === "string" &&
              item.trim()
          )
          .map((item) => item.trim())
          .slice(0, 6)
      : [],
  };
}

async function generateAnalysis(log) {
  const cleanLog = cleanLogForAI(log);

  const completion =
    await openai.chat.completions.create({
      model:
        process.env.OPENAI_MODEL ||
        "gpt-4.1-mini",

      response_format: {
        type: "json_object",
      },

      temperature: 0.4,

      messages: [
        {
          role: "system",
          content: `
You are the observation system for SOFT SYSTEMS.

SOFT SYSTEMS records relationships between bodily states,
emotions, environment, movement, routines, learning,
artistic input, and creative work.

Analyze only the supplied daily record.
Do not diagnose medical or mental-health conditions.
Do not invent facts that are absent from the record.
Use calm, precise, observational language.
Avoid productivity pressure and moral judgment.

Return valid JSON only, using exactly this structure:

{
  "summary": "A concise paragraph describing the day's overall state and flow.",
  "relationship": "A concise observation about relationships among body, environment, mood, movement, and creative practice.",
  "emotions": ["short phrase"],
  "themes": ["short phrase"],
  "keywords": ["short phrase"],
  "body_signals": ["short phrase"],
  "practice_signals": ["short phrase"]
}

All prose and tags must be written in English.
Do not wrap the JSON in markdown.
          `.trim(),
        },
        {
          role: "user",
          content: JSON.stringify(
            cleanLog,
            null,
            2
          ),
        },
      ],
    });

  const rawContent =
    completion.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error(
      "OpenAI returned an empty response."
    );
  }

  let parsed;

  try {
    parsed = JSON.parse(rawContent);
  } catch (error) {
    console.error(
      "Failed to parse OpenAI response:",
      rawContent
    );

    throw new Error(
      "OpenAI response was not valid JSON."
    );
  }

  const validated =
    validateAnalysis(parsed);

  if (!validated) {
    throw new Error(
      "OpenAI response did not contain a valid summary."
    );
  }

  return {
    ...validated,
    model:
      process.env.OPENAI_MODEL ||
      "gpt-4.1-mini",
    generated_at: new Date().toISOString(),
  };
}

async function analyzeLog(logId, force = false) {
  if (!logId) {
    return {
      status: 400,
      body: {
        error: "A field log ID is required.",
      },
    };
  }

  const { data: log, error: fetchError } =
    await supabaseAdmin
      .from("field_logs")
      .select("*")
      .eq("id", logId)
      .single();

  if (fetchError || !log) {
    console.error(
      "Field log fetch error:",
      fetchError
    );

    return {
      status: 404,
      body: {
        error: "Field log not found.",
        details:
          fetchError?.message || null,
      },
    };
  }

  const existingAnalysis =
    isValidObject(log.ai_analysis)
      ? log.ai_analysis
      : {};

  const hasExistingSummary =
    typeof existingAnalysis.summary ===
      "string" &&
    existingAnalysis.summary.trim() !== "";

  /*
   * force가 false이고 정상 분석이 이미 있으면
   * OpenAI를 다시 호출하지 않는다.
   *
   * ai_analysis가 {}인 기록은
   * hasExistingSummary가 false이므로 다시 생성된다.
   */
  if (hasExistingSummary && !force) {
    return {
      status: 200,
      body: {
        success: true,
        skipped: true,
        message:
          "This log already has an AI analysis.",
        analysis: existingAnalysis,
      },
    };
  }

  const analysis =
    await generateAnalysis(log);

  const { data: updatedLog, error: updateError } =
    await supabaseAdmin
      .from("field_logs")
      .update({
        ai_analysis: analysis,
      })
      .eq("id", logId)
      .select("*")
      .single();

  if (updateError) {
    console.error(
      "AI analysis update error:",
      updateError
    );

    return {
      status: 500,
      body: {
        error:
          "The analysis was generated but could not be saved.",
        details: updateError.message,
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      skipped: false,
      analysis,
      log: updatedLog,
    },
  };
}

/*
 * POST /api/analyze
 *
 * 허용되는 요청:
 * { "id": "field-log-id" }
 * { "logId": "field-log-id" }
 * { "id": "field-log-id", "force": true }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    const logId =
      body?.id ||
      body?.logId ||
      body?.log_id;

    const force =
      body?.force === true;

    const result =
      await analyzeLog(logId, force);

    return NextResponse.json(
      result.body,
      {
        status: result.status,
      }
    );
  } catch (error) {
    console.error(
      "Analyze API POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "AI analysis could not be generated.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * 브라우저 테스트용:
 * GET /api/analyze?id=기록ID
 * GET /api/analyze?id=기록ID&force=true
 */
export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const logId =
      searchParams.get("id") ||
      searchParams.get("logId");

    const force =
      searchParams.get("force") ===
      "true";

    const result =
      await analyzeLog(logId, force);

    return NextResponse.json(
      result.body,
      {
        status: result.status,
      }
    );
  } catch (error) {
    console.error(
      "Analyze API GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "AI analysis could not be generated.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
