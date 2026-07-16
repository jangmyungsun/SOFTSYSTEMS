import { NextResponse } from "next/server";

import { openai } from "../../../lib/openai";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const SUPPORTED_LOCALES = ["en", "ko"];

function normalizeLocale(value) {
  if (!value) {
    return "en";
  }

  const normalized = String(value).toLowerCase();

  if (normalized.startsWith("ko")) {
    return "ko";
  }

  return "en";
}

function resolveLocale(request, body) {
  const fromBody = normalizeLocale(body?.locale);

  if (SUPPORTED_LOCALES.includes(fromBody) && body?.locale) {
    return fromBody;
  }

  const fromHeader = normalizeLocale(request.headers.get("x-softsystems-locale"));

  if (SUPPORTED_LOCALES.includes(fromHeader) && request.headers.get("x-softsystems-locale")) {
    return fromHeader;
  }

  return normalizeLocale(request.headers.get("accept-language"));
}

function languageName(locale) {
  return locale === "ko" ? "Korean" : "English";
}

function localizeMessage(locale, key) {
  const messages = {
    en: {
      authRequired: "Authentication is required.",
      invalidAuth: "Invalid authentication.",
      dailyRequired: "Daily data is required.",
      noAnalysis: "The AI returned no analysis.",
      failed: "AI analysis failed.",
    },
    ko: {
      authRequired: "인증이 필요합니다.",
      invalidAuth: "유효하지 않은 인증입니다.",
      dailyRequired: "일일 데이터가 필요합니다.",
      noAnalysis: "AI 분석 결과가 반환되지 않았습니다.",
      failed: "AI 분석에 실패했습니다.",
    },
  };

  return messages[locale]?.[key] || messages.en[key];
}

const ANALYSIS_SCHEMA = {
  type: "object",

  properties: {
    summary: {
      type: "string",
      description:
        "A concise observation of the day in one or two sentences.",
    },

    emotions: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 5,
    },

    themes: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 6,
    },

    keywords: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 10,
    },

    body_signals: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 5,
    },

    practice_signals: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 5,
    },

    relationship: {
      type: "string",
      description:
        "A careful observation about relationships among body, body practice, environment, artistic input, and creative practice.",
    },
  },

  required: [
    "summary",
    "emotions",
    "themes",
    "keywords",
    "body_signals",
    "practice_signals",
    "relationship",
  ],

  additionalProperties: false,
};

function getObject(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
}

function getArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function makeAnalysisInput(log) {
  const state =
    getObject(log.state);

  const movement =
    getObject(log.movement);

  const environment =
    getObject(log.environment);

  const work =
    getObject(log.work);

  const artisticInput =
    getObject(log.artistic_input);

  const mediaItems =
    getArray(log.media);

  const learningItems =
    getArray(log.learning);

  const tomorrowItems =
    getArray(log.tomorrow);

  const makingItems =
    getArray(work.items);

  return {
    date:
      log.date || "",

    body: {
      body_state:
        state.body_state || null,

      energy:
        state.energy || null,

      mood:
        state.mood || null,

      weight:
        state.weight || null,

      temperature:
        state.temperature || null,
    },

    body_practice: {
      time:
        movement.time || "",

      type:
        movement.type || "",

      intensity:
        movement.intensity || "",

      notes:
        movement.notes || "",
    },

    environment,

    making: {
      time:
        work.time || "",

      project:
        work.project || "",

      notes:
        makingItems,
    },

    learning:
      learningItems,

    artistic_input: {
      type:
        artisticInput.type || "",

      title:
        artisticInput.title || "",

      creator:
        artisticInput.creator || "",

      note:
        artisticInput.note || "",
    },

    observation:
      log.observation || "",

    alignment:
      log.alignment || "",

    tomorrow:
      tomorrowItems,

    media:
      mediaItems.map((item) => ({
        type:
          item?.type || "",

        name:
          item?.name ||
          item?.file_name ||
          "",
      })),
  };
}

export async function POST(request) {
  let locale = "en";

  try {
    let requestBody = {};

    try {
      requestBody = await request.json();
    } catch {
      requestBody = {};
    }

    locale = resolveLocale(request, requestBody);

    const authorization =
      request.headers.get(
        "authorization"
      );

    const accessToken =
      authorization?.startsWith(
        "Bearer "
      )
        ? authorization.slice(7)
        : "";

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            localizeMessage(locale, "authRequired"),
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: userData,
      error: userError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData?.user
    ) {
      return NextResponse.json(
        {
          error:
            localizeMessage(locale, "invalidAuth"),
        },
        {
          status: 401,
        }
      );
    }

    const log =
      requestBody?.log;

    if (!log) {
      return NextResponse.json(
        {
          error:
            localizeMessage(locale, "dailyRequired"),
        },
        {
          status: 400,
        }
      );
    }

    const analysisInput =
      makeAnalysisInput(log);

    const model =
      process.env.OPENAI_MODEL ||
      "gpt-5.6";

    const response =
      await openai.responses.create({
        model,

        input: [
          {
            role: "system",

            content: `
You are the interpretive layer of SOFTSYSTEMS.

SOFTSYSTEMS is not a productivity tool.
It is an artistic ecology that observes relationships among body, body practice, environment, making, learning, artistic references, media, memory, and creation.

Your task is to carefully interpret one Daily record.

Body Practice describes what the body actually did during the day. It may include yoga, walking, running, stretching, strength work, swimming, cycling, dance, performance practice, or another embodied activity.

Observe possible relationships among:
- body state;
- energy and mood;
- Body Practice type, duration, intensity, and notes;
- environment and weather;
- making;
- learning;
- artistic input;
- observation;
- alignment.

Do not assume that Body Practice caused a later body state, mood, energy level, or creative outcome from one record alone.

The Artistic Input may include a book, film, performance, exhibition, music work, or another reference.

Do not summarize the artistic work itself unless that summary is directly necessary.

Instead, observe how the artistic input may relate to:
- body state;
- Body Practice;
- energy and mood;
- environment;
- observation;
- making;
- learning;
- alignment;
- recurring artistic concerns.

Treat Body Practice and Artistic Input as signals within the day, not as proof of causation.

Do not give generic motivation.
Do not praise productivity.
Do not make medical diagnoses.
Do not exaggerate patterns from one entry.
Do not claim that weather, movement, or one artistic reference caused a body state or creative outcome.

Use calm, precise, observational language.
Treat uncertainty honestly.
Focus on signals and relationships that may become meaningful when compared over time.

When appropriate, include:
- the Body Practice type;
- the artistic input title, creator, medium, or central concern;
- relevant bodily or creative signals;
in themes or keywords.

Respond entirely in the user's selected language.
            `.trim(),
          },

          {
            role: "user",

            content:
              JSON.stringify(
                {
                  selected_language: languageName(locale),
                  locale,
                  analysis_input: analysisInput,
                },
                null,
                2
              ),
          },
        ],

        text: {
          format: {
            type:
              "json_schema",

            name:
              "softsystems_daily_analysis",

            strict:
              true,

            schema:
              ANALYSIS_SCHEMA,
          },
        },
      });

    if (!response.output_text) {
      throw new Error(
        localizeMessage(locale, "noAnalysis")
      );
    }

    const analysis =
      JSON.parse(
        response.output_text
      );

    return NextResponse.json({
      analysis: {
        ...analysis,

        analyzed_at:
          new Date()
            .toISOString(),

        model,
      },
    });
  } catch (error) {
    console.error(
      "AI analysis failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          localizeMessage(locale, "failed"),
      },
      {
        status: 500,
      }
    );
  }
}
