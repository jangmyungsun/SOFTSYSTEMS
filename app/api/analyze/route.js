import { NextResponse } from "next/server";

import { openai } from "../../../lib/openai";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

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
        "A careful observation about the relationship between body, environment, and artistic practice.",
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

function makeAnalysisInput(log) {
  return {
    date: log.date,

    body: {
      body_state:
        log.state?.body_state || null,

      energy:
        log.state?.energy || null,

      mood:
        log.state?.mood || null,

      weight:
        log.state?.weight || null,

      temperature:
        log.state?.temperature || null,
    },

    environment:
      log.environment || {},

    making: {
      time:
        log.work?.time || "",

      project:
        log.work?.project || "",

      notes:
        log.work?.items || [],
    },

    learning:
      log.learning || [],
    
artistic_input: {
  type:
    log.artistic_input?.type || "",

  title:
    log.artistic_input?.title || "",

  creator:
    log.artistic_input?.creator || "",

  note:
    log.artistic_input?.note || "",
},
    
    observation:
      log.observation || "",

    alignment:
      log.alignment || "",

    tomorrow:
      log.tomorrow || [],

    media:
      (log.media || []).map(
        (item) => ({
          type: item.type,
          name: item.name,
        })
      ),
  };
}

export async function POST(request) {
  try {
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
            "Authentication is required.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 요청자가 실제 Supabase 로그인
     * 사용자인지 확인한다.
     */
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
            "Invalid authentication.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const log = body.log;

    if (!log) {
      return NextResponse.json(
        {
          error:
            "Daily data is required.",
        },
        {
          status: 400,
        }
      );
    }

    const analysisInput =
      makeAnalysisInput(log);

    const response =
      await openai.responses.create({
        model:
          process.env
            .OPENAI_MODEL ||
          "gpt-5.6",

        input: [
          {
            role: "system",

            content: `
You are the interpretive layer of SOFTSYSTEMS.

SOFTSYSTEMS is not a productivity tool.
It is an artistic ecology that observes relationships among body, environment, practice, memory, and creation.

Your task is to carefully interpret one Daily record.

Do not give generic motivation.
Do not praise productivity.
Do not make medical diagnoses.
Do not exaggerate patterns from one entry.

Use calm, precise, observational language.
Treat uncertainty honestly.
Focus on signals and relationships that may become meaningful when compared over time.

Return all labels and observations in English.
            `.trim(),
          },

          {
            role: "user",

            content:
              JSON.stringify(
                analysisInput,
                null,
                2
              ),
          },
        ],

        text: {
          format: {
            type: "json_schema",
            name:
              "softsystems_daily_analysis",
            strict: true,
            schema:
              ANALYSIS_SCHEMA,
          },
        },
      });

    if (!response.output_text) {
      throw new Error(
        "The AI returned no analysis."
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
          new Date().toISOString(),

        model:
          process.env
            .OPENAI_MODEL ||
          "gpt-5.6",
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
          error.message ||
          "AI analysis failed.",
      },
      {
        status: 500,
      }
    );
  }
}
