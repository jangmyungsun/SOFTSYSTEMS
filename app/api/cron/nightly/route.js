import { NextResponse } from "next/server";

import { openai } from "../../../../lib/openai";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const CHAT_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5.6";

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ||
  "text-embedding-3-small";

const SYSTEM_PERIOD_DAYS = 30;
const GUIDANCE_PERIOD_DAYS = 14;

const MAX_LOGS = 100;
const MAX_EDGES = 80;
const MIN_SIMILARITY = 0.72;

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

        additionalProperties:
          false,
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

        additionalProperties:
          false,
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
        "One open-ended question for continued observation rather than productivity advice.",
    },

    confidence_note: {
      type: "string",
      description:
        "A brief statement describing the limits of the available evidence.",
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

const GUIDANCE_SCHEMA = {
  type: "object",

  properties: {
    state: {
      type: "string",
      description:
        "A short name for today's suggested orientation.",
    },

    reading: {
      type: "string",
      description:
        "A careful interpretation of recent records.",
    },

    suggested_gesture: {
      type: "string",
      description:
        "One small, specific, low-pressure action for today.",
    },

    avoid: {
      type: "string",
      description:
        "A form of intensity that may be useful to avoid or reduce.",
    },

    basis: {
      type: "array",

      items: {
        type: "string",
      },

      maxItems: 5,
    },

    confidence_note: {
      type: "string",
      description:
        "A short statement about uncertainty or limited data.",
    },
  },

  required: [
    "state",
    "reading",
    "suggested_gesture",
    "avoid",
    "basis",
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

function getDateString(
  date = new Date()
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function getStartDate(days) {
  const date = new Date();

  date.setUTCDate(
    date.getUTCDate() - days
  );

  return getDateString(date);
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
    getObject(
      log.artistic_input
    );

  const aiAnalysis =
    getObject(
      log.ai_analysis
    );

  return {
    id:
      log.id,

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

    body_moving: {
      type:
        movement.type ||
        "",

      time:
        movement.time ||
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

function makeEmbeddingText(log) {
  const state =
    getObject(log.state);

  const movement =
    getObject(log.movement);

  const environment =
    getObject(
      log.environment
    );

  const work =
    getObject(log.work);

  const artisticInput =
    getObject(
      log.artistic_input
    );

  const ai =
    getObject(
      log.ai_analysis
    );

  const makingItems =
    getArray(
      work.items
    ).join("\n");

  const learning =
    getArray(
      log.learning
    ).join("\n");

  const tomorrow =
    getArray(
      log.tomorrow
    ).join("\n");

  const themes =
    getArray(
      ai.themes
    ).join(", ");

  const emotions =
    getArray(
      ai.emotions
    ).join(", ");

  const keywords =
    getArray(
      ai.keywords
    ).join(", ");

  const bodySignals =
    getArray(
      ai.body_signals
    ).join(", ");

  const practiceSignals =
    getArray(
      ai.practice_signals
    ).join(", ");

  const bodyMovingText = [
    movement.type
      ? `Type: ${movement.type}`
      : "",

    movement.time
      ? `Time: ${movement.time}`
      : "",

    movement.intensity
      ? `Intensity: ${movement.intensity} out of 5`
      : "",

    movement.notes
      ? `Notes: ${movement.notes}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const artisticInputText = [
    artisticInput.type
      ? `Type: ${artisticInput.type}`
      : "",

    artisticInput.title
      ? `Title: ${artisticInput.title}`
      : "",

    artisticInput.creator
      ? `Creator: ${artisticInput.creator}`
      : "",

    artisticInput.note
      ? `Reference note: ${artisticInput.note}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    log.date
      ? `Date: ${log.date}`
      : "",

    state.body_state !==
      undefined &&
    state.body_state !== ""
      ? `Body state: ${state.body_state}`
      : "",

    state.energy !==
      undefined &&
    state.energy !== ""
      ? `Energy: ${state.energy}`
      : "",

    state.mood !==
      undefined &&
    state.mood !== ""
      ? `Mood: ${state.mood}`
      : "",

    state.weight !==
      undefined &&
    state.weight !== ""
      ? `Weight: ${state.weight}`
      : "",

    state.temperature !==
      undefined &&
    state.temperature !== ""
      ? `Body temperature: ${state.temperature}`
      : "",

    bodyMovingText
      ? `Body moving:\n${bodyMovingText}`
      : "",

    environment.weather
      ? `Weather: ${environment.weather}`
      : "",

    environment.temperature !==
      undefined &&
    environment.temperature !==
      null &&
    environment.temperature !== ""
      ? `Environment temperature: ${environment.temperature}`
      : "",

    environment.humidity !==
      undefined &&
    environment.humidity !==
      null &&
    environment.humidity !== ""
      ? `Humidity: ${environment.humidity}`
      : "",

    environment.pressure !==
      undefined &&
    environment.pressure !==
      null &&
    environment.pressure !== ""
      ? `Pressure: ${environment.pressure}`
      : "",

    environment.wind !==
      undefined &&
    environment.wind !==
      null &&
    environment.wind !== ""
      ? `Wind: ${environment.wind}`
      : "",

    work.project
      ? `Project: ${work.project}`
      : "",

    work.time
      ? `Making time: ${work.time}`
      : "",

    makingItems
      ? `Making notes:\n${makingItems}`
      : "",

    learning
      ? `Learning:\n${learning}`
      : "",

    artisticInputText
      ? `Artistic input:\n${artisticInputText}`
      : "",

    log.observation
      ? `Observation: ${log.observation}`
      : "",

    log.alignment
      ? `Alignment: ${log.alignment}`
      : "",

    tomorrow
      ? `Tomorrow:\n${tomorrow}`
      : "",

    ai.summary
      ? `AI summary: ${ai.summary}`
      : "",

    ai.relationship
      ? `AI relationship: ${ai.relationship}`
      : "",

    themes
      ? `Themes: ${themes}`
      : "",

    emotions
      ? `Emotions: ${emotions}`
      : "",

    keywords
      ? `Keywords: ${keywords}`
      : "",

    bodySignals
      ? `Body signals: ${bodySignals}`
      : "",

    practiceSignals
      ? `Practice signals: ${practiceSignals}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function parseEmbedding(value) {
  if (
    Array.isArray(value)
  ) {
    return value
      .map(Number)
      .filter(
        Number.isFinite
      );
  }

  if (
    typeof value ===
    "string"
  ) {
    return value
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map(Number)
      .filter(
        Number.isFinite
      );
  }

  return null;
}

function cosineSimilarity(
  firstVector,
  secondVector
) {
  if (
    !Array.isArray(
      firstVector
    ) ||
    !Array.isArray(
      secondVector
    ) ||
    firstVector.length === 0 ||
    firstVector.length !==
      secondVector.length
  ) {
    return 0;
  }

  let dotProduct = 0;
  let firstNorm = 0;
  let secondNorm = 0;

  for (
    let index = 0;
    index <
    firstVector.length;
    index += 1
  ) {
    const firstValue =
      Number(
        firstVector[index]
      );

    const secondValue =
      Number(
        secondVector[index]
      );

    dotProduct +=
      firstValue *
      secondValue;

    firstNorm +=
      firstValue *
      firstValue;

    secondNorm +=
      secondValue *
      secondValue;
  }

  if (
    !firstNorm ||
    !secondNorm
  ) {
    return 0;
  }

  return (
    dotProduct /
    (
      Math.sqrt(
        firstNorm
      ) *
      Math.sqrt(
        secondNorm
      )
    )
  );
}

function makeWeaveNode(log) {
  const state =
    getObject(log.state);

  const movement =
    getObject(log.movement);

  const environment =
    getObject(
      log.environment
    );

  const work =
    getObject(log.work);

  const artisticInput =
    getObject(
      log.artistic_input
    );

  const ai =
    getObject(
      log.ai_analysis
    );

  const bodyMoving = {
    type:
      movement.type ||
      "",

    time:
      movement.time ||
      "",

    intensity:
      movement.intensity ||
      "",

    notes:
      movement.notes ||
      "",
  };

  return {
    id:
      log.id,

    date:
      log.date || "",

    summary:
      ai.summary ||
      log.observation ||
      artisticInput.title ||
      movement.notes ||
      work.project ||
      "Untitled Daily",

    observation:
      log.observation ||
      "",

    alignment:
      log.alignment ||
      "",

    themes:
      getArray(
        ai.themes
      ),

    emotions:
      getArray(
        ai.emotions
      ),

    keywords:
      getArray(
        ai.keywords
      ),

    body_signals:
      getArray(
        ai.body_signals
      ),

    practice_signals:
      getArray(
        ai.practice_signals
      ),

    relationship:
      ai.relationship ||
      "",

    body_state:
      state.body_state ||
      "",

    energy:
      state.energy ||
      "",

    mood:
      state.mood ||
      "",

    weather:
      environment.weather ||
      "",

    environment: {
      weather:
        environment.weather ||
        "",

      temperature:
        environment.temperature ??
        "",

      humidity:
        environment.humidity ??
        "",

      pressure:
        environment.pressure ??
        "",

      wind:
        environment.wind ??
        "",

      sunrise:
        environment.sunrise ||
        "",

      sunset:
        environment.sunset ||
        "",
    },

    body_moving:
      bodyMoving,

    /*
     * 기존 Weave snapshot과
     * 화면 코드의 호환성을 위해
     * 임시로 같은 데이터를 함께 저장한다.
     */
    body_practice:
      bodyMoving,

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

    /*
     * 이전 화면에서 project를
     * 직접 읽을 수 있으므로 유지한다.
     */
    project:
      work.project ||
      "",

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
  };
}

async function generateSystemReading(
  logs
) {
  const records =
    logs
      .filter(
        (log) =>
          log.date >=
          getStartDate(
            SYSTEM_PERIOD_DAYS
          )
      )
      .map(
        cleanLog
      );

  if (!records.length) {
    return {
      current_mode:
        "Not enough material",

      overview:
        "The system has not gathered enough recent material for a grounded period reading.",

      recurring_signals:
        [],

      relationships:
        [],

      shifts:
        [],

      open_question:
        "What is beginning to repeat?",

      confidence_note:
        "No recent Daily records were available.",

      period_days:
        SYSTEM_PERIOD_DAYS,

      record_count:
        0,

      generated_at:
        new Date()
          .toISOString(),

      model:
        CHAT_MODEL,
    };
  }

  const response =
    await openai.responses.create({
      model:
        CHAT_MODEL,

      input: [
        {
          role:
            "system",

          content: `
You are the period-reading layer of SOFTSYSTEMS.

SOFTSYSTEMS is an artistic ecology that observes relationships among body, Body Moving, environment, making, learning, artistic input, media, memory, and creation.

You are reading several Daily records together.

Body Moving describes what the body actually did during the day. It may include yoga, walking, running, stretching, strength work, cycling, swimming, dance, performance practice, housework, or another embodied activity.

Artistic Input may include a book, film, performance, exhibition, music work, or another artistic reference.

Your task:
- identify recurring signals supported by multiple records;
- identify changes across time;
- identify careful relationships among body state, Body Moving, environment, making, learning, artistic input, observation, and alignment;
- notice repeated relationships among movement, recovery, energy, mood, making, and learning;
- notice repeated artists, creators, works, media types, and artistic concerns;
- notice when artistic input appears alongside later making or observation;
- distinguish evidence from speculation;
- state uncertainty honestly.

Do not give generic motivation.
Do not praise productivity.
Do not provide medical diagnosis.
Do not claim causation from correlation.
Do not infer a stable pattern from one record.
Do not invent unsupported evidence.

Use calm, precise, observational English.

The open question should invite continued noticing rather than instruct the artist to work harder.
          `.trim(),
        },

        {
          role:
            "user",

          content:
            JSON.stringify(
              {
                period_days:
                  SYSTEM_PERIOD_DAYS,

                record_count:
                  records.length,

                records,
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
            "softsystems_system_reading",

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

  return {
    ...JSON.parse(
      response.output_text
    ),

    period_days:
      SYSTEM_PERIOD_DAYS,

    record_count:
      records.length,

    generated_at:
      new Date()
        .toISOString(),

    model:
      CHAT_MODEL,
  };
}

async function generateGuidance(
  logs,
  systemReading
) {
  const recentLogs =
    logs
      .filter(
        (log) =>
          log.date >=
          getStartDate(
            GUIDANCE_PERIOD_DAYS
          )
      )
      .map(
        cleanLog
      );

  if (
    !recentLogs.length
  ) {
    return {
      state:
        "Listening",

      reading:
        "There is not enough recent material to make a grounded suggestion.",

      suggested_gesture:
        "Notice one sound, image, or bodily signal without needing to develop it.",

      avoid:
        "Avoid treating the absence of data as a problem.",

      basis: [
        "No recent Daily records were available.",
      ],

      confidence_note:
        "This suggestion is intentionally general because recent data is limited.",

      generated_at:
        new Date()
          .toISOString(),

      model:
        CHAT_MODEL,
    };
  }

  const response =
    await openai.responses.create({
      model:
        CHAT_MODEL,

      input: [
        {
          role:
            "system",

          content: `
You create the daily Soft Suggestion for SOFTSYSTEMS.

SOFTSYSTEMS is not a productivity application.

The suggestion should support the artist's body, attention, recovery, and creative ecology.

Use the recent Daily records and the latest System reading.

You may notice:
- low body state, energy, or mood;
- signs of strain or incomplete recovery;
- weather conditions that previously appeared alongside particular reactions;
- patterns around making, listening, walking, collecting, editing, learning, resting, or observing;
- Body Moving such as yoga, walking, running, stretching, performance practice, housework, or gentle movement that previously appeared alongside particular bodily or creative states;
- artistic inputs that may offer a gentle direction;
- a next experiment already written in the recent records.

Give one small, concrete, realistic gesture.

Appropriate examples:
- take a short walk and collect one sound;
- listen without editing;
- keep making light;
- work near a window;
- reread one marked passage;
- leave the material unorganized today;
- choose gentle stretching rather than intense movement;
- rest or reduce intensity when the records support it.

Do not diagnose illness.
Do not prescribe medical treatment.
Do not say weather caused a reaction.
Do not claim Body Moving caused a later outcome.
Do not give generic productivity advice.
Do not tell the artist to push harder.
Do not invent evidence.

If recent records indicate pain, illness, fatigue, or strain, use cautious language such as:
"Consider keeping today's activity gentle."

Never present the system as a substitute for medical care.

Use calm, precise, concise English.
          `.trim(),
        },

        {
          role:
            "user",

          content:
            JSON.stringify(
              {
                guidance_date:
                  getDateString(),

                recent_records:
                  recentLogs,

                latest_system_reading:
                  systemReading,
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
            "softsystems_daily_guidance",

          strict:
            true,

          schema:
            GUIDANCE_SCHEMA,
        },
      },
    });

  if (
    !response.output_text
  ) {
    throw new Error(
      "The AI returned no guidance."
    );
  }

  return {
    ...JSON.parse(
      response.output_text
    ),

    generated_at:
      new Date()
        .toISOString(),

    model:
      CHAT_MODEL,
  };
}

async function generateWeave(
  logs
) {
  const preparedLogs =
    logs
      .slice(
        -MAX_LOGS
      )
      .map(
        (log) => ({
          ...log,

          nextEmbeddingText:
            makeEmbeddingText(
              log
            ),
        })
      );

  const logsNeedingEmbedding =
    preparedLogs.filter(
      (log) => {
        const hasEmbedding =
          Boolean(
            log.embedding
          );

        const textChanged =
          log.embedding_text !==
          log.nextEmbeddingText;

        return (
          !hasEmbedding ||
          textChanged
        );
      }
    );

  if (
    logsNeedingEmbedding.length >
    0
  ) {
    const embeddingResponse =
      await openai.embeddings.create({
        model:
          EMBEDDING_MODEL,

        input:
          logsNeedingEmbedding.map(
            (log) =>
              log.nextEmbeddingText
          ),
      });

    for (
      let index = 0;
      index <
      logsNeedingEmbedding.length;
      index += 1
    ) {
      const log =
        logsNeedingEmbedding[
          index
        ];

      const embedding =
        embeddingResponse
          .data[index]
          ?.embedding;

      if (!embedding) {
        continue;
      }

      const updatedAt =
        new Date()
          .toISOString();

      log.embedding =
        embedding;

      log.embedding_text =
        log.nextEmbeddingText;

      log.embedding_updated_at =
        updatedAt;

      const {
        error:
          updateError,
      } = await supabaseAdmin
        .from(
          "field_logs"
        )
        .update({
          embedding,

          embedding_text:
            log.nextEmbeddingText,

          embedding_updated_at:
            updatedAt,
        })
        .eq(
          "id",
          log.id
        );

      if (
        updateError
      ) {
        throw updateError;
      }
    }
  }

  const usableLogs =
    preparedLogs
      .map(
        (log) => ({
          ...log,

          parsedEmbedding:
            parseEmbedding(
              log.embedding
            ),
        })
      )
      .filter(
        (log) =>
          Array.isArray(
            log.parsedEmbedding
          ) &&
          log
            .parsedEmbedding
            .length > 0
      );

  const edges = [];

  for (
    let firstIndex = 0;
    firstIndex <
    usableLogs.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex <
        usableLogs.length;
      secondIndex += 1
    ) {
      const firstLog =
        usableLogs[
          firstIndex
        ];

      const secondLog =
        usableLogs[
          secondIndex
        ];

      const similarity =
        cosineSimilarity(
          firstLog
            .parsedEmbedding,

          secondLog
            .parsedEmbedding
        );

      if (
        similarity >=
        MIN_SIMILARITY
      ) {
        edges.push({
          source:
            firstLog.id,

          target:
            secondLog.id,

          similarity:
            Number(
              similarity.toFixed(
                4
              )
            ),
        });
      }
    }
  }

  edges.sort(
    (
      firstEdge,
      secondEdge
    ) =>
      secondEdge.similarity -
      firstEdge.similarity
  );

  return {
    nodes:
      usableLogs.map(
        makeWeaveNode
      ),

    edges:
      edges.slice(
        0,
        MAX_EDGES
      ),

    meta: {
      record_count:
        usableLogs.length,

      generated_embeddings:
        logsNeedingEmbedding
          .length,

      threshold:
        MIN_SIMILARITY,

      embedding_model:
        EMBEDDING_MODEL,

      includes_body_moving:
        true,

      /*
       * 기존 구조 확인용으로
       * 당분간 함께 유지한다.
       */
      includes_body_practice:
        true,

      includes_artistic_input:
        true,

      includes_observation:
        true,

      includes_alignment:
        true,

      includes_making:
        true,

      includes_learning:
        true,

      generated_at:
        new Date()
          .toISOString(),
    },
  };
}

export async function GET(
  request
) {
  try {
    const authorization =
      request.headers.get(
        "authorization"
      );

    const expectedAuthorization =
      `Bearer ${process.env.CRON_SECRET}`;

    if (
      !process.env.CRON_SECRET ||
      authorization !==
        expectedAuthorization
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized cron request.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: logs,
      error: logsError,
    } = await supabaseAdmin
      .from(
        "field_logs"
      )
      .select(
        `
          id,
          user_id,
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
          embedding,
          embedding_text,
          embedding_updated_at,
          is_public
        `
      )
      .eq(
        "is_public",
        true
      )
      .order(
        "date",
        {
          ascending: true,
        }
      )
      .limit(
        MAX_LOGS
      );

    if (
      logsError
    ) {
      throw logsError;
    }

    if (
      !logs?.length
    ) {
      return NextResponse.json({
        success:
          true,

        message:
          "No public Daily records were found.",
      });
    }

    const snapshotDate =
      getDateString();

    const systemReading =
      await generateSystemReading(
        logs
      );

    const {
      error:
        systemSnapshotError,
    } = await supabaseAdmin
      .from(
        "system_snapshots"
      )
      .upsert(
        {
          snapshot_date:
            snapshotDate,

          period_days:
            SYSTEM_PERIOD_DAYS,

          reading:
            systemReading,

          generated_at:
            new Date()
              .toISOString(),

          is_public:
            true,
        },
        {
          onConflict:
            "snapshot_date",
        }
      );

    if (
      systemSnapshotError
    ) {
      throw systemSnapshotError;
    }

    const guidance =
      await generateGuidance(
        logs,
        systemReading
      );

    const {
      error:
        guidanceError,
    } = await supabaseAdmin
      .from(
        "daily_guidance"
      )
      .upsert(
        {
          guidance_date:
            snapshotDate,

          guidance,

          generated_at:
            new Date()
              .toISOString(),

          is_public:
            true,
        },
        {
          onConflict:
            "guidance_date",
        }
      );

    if (
      guidanceError
    ) {
      throw guidanceError;
    }

    const weave =
      await generateWeave(
        logs
      );

    const {
      error:
        weaveSnapshotError,
    } = await supabaseAdmin
      .from(
        "weave_snapshots"
      )
      .upsert(
        {
          snapshot_date:
            snapshotDate,

          nodes:
            weave.nodes,

          edges:
            weave.edges,

          meta:
            weave.meta,

          generated_at:
            new Date()
              .toISOString(),

          is_public:
            true,
        },
        {
          onConflict:
            "snapshot_date",
        }
      );

    if (
      weaveSnapshotError
    ) {
      throw weaveSnapshotError;
    }

    return NextResponse.json({
      success:
        true,

      snapshot_date:
        snapshotDate,

      system: {
        record_count:
          systemReading
            .record_count,

        current_mode:
          systemReading
            .current_mode,
      },

      guidance: {
        state:
          guidance.state,

        suggested_gesture:
          guidance
            .suggested_gesture,
      },

      weave: {
        nodes:
          weave.nodes.length,

        edges:
          weave.edges.length,

        generated_embeddings:
          weave.meta
            .generated_embeddings,
      },
    });
  } catch (error) {
    console.error(
      "Nightly cron failed:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          "Nightly cron failed.",
      },
      {
        status: 500,
      }
    );
  }
}
