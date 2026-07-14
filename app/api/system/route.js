import { NextResponse } from "next/server";

import { openai } from "../../../lib/openai";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const SYSTEM_SCHEMA = {
  type: "object",

  properties: {
    current_mode: {
      type: "string",
      description:
        "A concise name for the current mode of the artistic ecology.",
    },

    overview: {
      type: "string",
      description:
        "A precise two-to-four sentence reading of the recent period.",
    },

    recurring_signals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          signal: {
            type: "string",
          },
          evidence: {
            type: "string",
          },
        },
        required: [
          "signal",
          "evidence",
        ],
        additionalProperties: false,
      },
      maxItems: 6,
    },

    relationships: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source: {
            type: "string",
          },
          target: {
            type: "string",
          },
          observation: {
            type: "string",
          },
        },
        required: [
          "source",
          "target",
          "observation",
        ],
        additionalProperties: false,
      },
      maxItems: 6,
    },

    shifts: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 5,
    },

    open_question: {
      type: "string",
      description:
        "One open-ended question for continued observation, not productivity advice.",
    },

    confidence_note: {
      type: "string",
      description:
        "A brief note explaining the limits of the available data.",
    },
  },

  required: [
    "current_mode",
    "overview",
    "recurring_signals",
    "relationships",
    "shifts",
    "open_question",
    "confidence_note",
  ],

  additionalProperties: false,
};

function cleanLog(log) {
  return {
    date: log.date,

    body: {
      body_state:
        log.state?.body_state ||
        null,

      energy:
        log.state?.energy ||
        null,

      mood:
        log.state?.mood ||
        null,

      weight:
        log.state?.weight ||
        null,

      temperature:
        log.state?.temperature ||
        null,
    },

    environment:
      log.environment || {},

    making: {
      time:
        log.work?.time || "",

      project:
        log.work?.project || "",

      notes:
        Array.isArray(
          log.work?.items
        )
          ? log.work.items
          : [],
    },

    learning:
      Array.isArray(log.learning)
        ? log.learning
        : [],

    observation:
      log.observation || "",

    alignment:
      log.alignment || "",

    tomorrow:
      Array.isArray(log.tomorrow)
        ? log.tomorrow
        : [],

    ai_analysis:
      log.ai_analysis || {},
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

    const days = Math.min(
      Math.max(
        Number(body.days) || 30,
        7
      ),
      90
    );

    const startDate =
      new Date();

    startDate.setDate(
      startDate.getDate() -
        days
    );

    const dateString =
      startDate
        .toISOString()
        .slice(0, 10);

    const {
      data: logs,
      error: logsError,
    } = await supabaseAdmin
      .from("field_logs")
      .select(
        `
          id,
          date,
          state,
          environment,
          work,
          learning,
          observation,
          alignment,
          tomorrow,
          ai_analysis,
          media,
          is_public
        `
      )
      .eq(
        "user_id",
        userData.user.id
      )
      .gte("date", dateString)
      .order("date", {
        ascending: true,
      })
      .limit(90);

    if (logsError) {
      throw logsError;
    }

    if (!logs?.length) {
      return NextResponse.json(
        {
          error:
            "There are no Daily records in this period.",
        },
        {
          status: 400,
        }
      );
    }

    const input = {
      period_days: days,
      record_count:
        logs.length,
      records:
        logs.map(cleanLog),
    };

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

SOFTSYSTEMS is an artistic ecology that observes relationships among body, environment, practice, memory, media, and creation.

You are analyzing several Daily records together.

Your task:
- identify recurring signals supported by the records;
- identify changes across time;
- identify careful relationships among body, environment, making, learning, and observation;
- distinguish evidence from speculation;
- avoid generic motivation;
- avoid productivity coaching;
- avoid medical diagnosis;
- do not claim causation from correlation;
- do not invent patterns that are not supported by multiple records.

Use calm, precise, observational English.

The open question should invite continued noticing rather than tell the artist what to do.
            `.trim(),
          },

          {
            role: "user",

            content:
              JSON.stringify(
                input,
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
              "softsystems_period_reading",

            strict: true,

            schema:
              SYSTEM_SCHEMA,
          },
        },
      });

    if (
      !response.output_text
    ) {
      throw new Error(
        "The AI returned no System reading."
      );
    }

    const reading =
      JSON.parse(
        response.output_text
      );

    return NextResponse.json({
      reading: {
        ...reading,

        period_days:
          days,

        record_count:
          logs.length,

        generated_at:
          new Date()
            .toISOString(),

        model:
          process.env
            .OPENAI_MODEL ||
          "gpt-5.6",
      },
    });
  } catch (error) {
    console.error(
      "System analysis failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "System analysis failed.",
      },
      {
        status: 500,
      }
    );
  }
}
