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

function cleanLog(log) {
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

  const aiAnalysis =
    getObject(log.ai_analysis);

  return {
    date:
      log.date || "",

    body: {
      body_state:
        state.body_state ||
        null,

      energy:
        state.energy ||
        null,

      mood:
        state.mood ||
        null,

      weight:
        state.weight ||
        null,

      temperature:
        state.temperature ||
        null,
    },

    body_practice: {
      time:
        movement.time ||
        "",

      type:
        movement.type ||
        "",

      intensity:
        movement.intensity ||
        "",

      notes:
        movement.notes ||
        "",
    },

    environment,

    making: {
      time:
        work.time ||
        "",

      project:
        work.project ||
        "",

      notes:
        getArray(
          work.items
        ),
    },

    learning:
      getArray(
        log.learning
      ),

    artistic_input: {
      type:
        artisticInput.type ||
        "",

      title:
        artisticInput.title ||
        "",

      creator:
        artisticInput.creator ||
        "",

      note:
        artisticInput.note ||
        "",
    },

    observation:
      log.observation ||
      "",

    alignment:
      log.alignment ||
      "",

    tomorrow:
      getArray(
        log.tomorrow
      ),

    ai_analysis:
      aiAnalysis,
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

    const requestBody =
      await request.json();

    const days =
      Math.min(
        Math.max(
          Number(
            requestBody?.days
          ) || 30,
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
          movement,
          environment,
          work,
          learning,
          artistic_input,
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
      .gte(
        "date",
        dateString
      )
      .order(
        "date",
        {
          ascending: true,
        }
      )
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
      period_days:
        days,

      record_count:
        logs.length,

      records:
        logs.map(
          cleanLog
        ),
    };

    const model =
      process.env
        .OPENAI_MODEL ||
      "gpt-5.6";

    const response =
      await openai.responses.create({
        model,

        input: [
          {
            role:
              "system",

            content: `
You are the interpretive layer of SOFTSYSTEMS.

SOFTSYSTEMS is an artistic ecology that observes relationships among body, Body Practice, environment, making, learning, artistic input, media, memory, and creation.

You are analyzing several Daily records together.

Body Practice describes what the body actually did during the day. It may include yoga, walking, running, stretching, strength work, swimming, cycling, dance, performance practice, or another embodied activity.

Artistic Input may include a book, film, performance, exhibition, music work, or another artistic reference.

Your task:
- identify recurring signals supported by multiple records;
- identify changes across time;
- identify careful relationships among body state, Body Practice, environment, making, learning, artistic input, and observation;
- notice repeated relationships among movement, recovery, energy, mood, making, and learning;
- notice repeated artists, works, creators, media types, or artistic concerns;
- notice when an artistic input appears to recur alongside later making or observation;
- distinguish evidence from speculation;
- avoid generic motivation;
- avoid productivity coaching;
- avoid medical diagnosis;
- do not claim causation from correlation;
- do not infer a stable pattern from one record;
- do not invent patterns unsupported by the data.

Use calm, precise, observational English.

The open question should invite continued noticing rather than tell the artist what to do.

When evidence is limited, say so clearly.
            `.trim(),
          },

          {
            role:
              "user",

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

            strict:
              true,

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

        model,
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
          error?.message ||
          "System analysis failed.",
      },
      {
        status: 500,
      }
    );
  }
}
