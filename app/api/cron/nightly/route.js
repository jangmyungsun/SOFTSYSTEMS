
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

/*
 * System 분석 결과 형식
 */
const SYSTEM_SCHEMA = {
  type: "object",

  properties: {
    current_mode: {
      type: "string",
    },

    overview: {
      type: "string",
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
    },

    confidence_note: {
      type: "string",
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

/*
 * Home 추천 결과 형식
 */
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
        "A careful interpretation of the recent records.",
    },

    suggested_gesture: {
      type: "string",
      description:
        "One small, concrete, low-pressure action for today.",
    },

    avoid: {
      type: "string",
      description:
        "An optional form of intensity to avoid or reduce.",
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

function getDateString(date = new Date()) {
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

/*
 * OpenAI에 전달할 기록을 정리한다.
 */
function cleanLog(log) {
  const state =
    getObject(log.state);

  const environment =
    getObject(log.environment);

  const work =
    getObject(log.work);

  const artisticInput =
    getObject(log.artistic_input);

  const aiAnalysis =
    getObject(log.ai_analysis);

  return {
    id: log.id,
    date: log.date,

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

    environment,

    making: {
      time:
        work.time || "",

      project:
        work.project || "",

      notes:
        getArray(work.items),
    },

    learning:
      getArray(log.learning),

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
      getArray(log.tomorrow),

    ai_analysis:
      aiAnalysis,
  };
}

/*
 * Weave embedding에 들어갈 의미 텍스트
 */
function makeEmbeddingText(log) {
  const state =
    getObject(log.state);

  const environment =
    getObject(log.environment);

  const work =
    getObject(log.work);

  const artisticInput =
    getObject(log.artistic_input);

  const ai =
    getObject(log.ai_analysis);

  const makingItems =
    getArray(work.items)
      .join("\n");

  const learning =
    getArray(log.learning)
      .join("\n");

  const tomorrow =
    getArray(log.tomorrow)
      .join("\n");

  const themes =
    getArray(ai.themes)
      .join(", ");

  const emotions =
    getArray(ai.emotions)
      .join(", ");

  const keywords =
    getArray(ai.keywords)
      .join(", ");

  const bodySignals =
    getArray(ai.body_signals)
      .join(", ");

  const practiceSignals =
    getArray(ai.practice_signals)
      .join(", ");

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

    environment.weather
      ? `Weather: ${environment.weather}`
      : "",

    environment.temperature !==
      undefined &&
    environment.temperature !== null
      ? `Environment temperature: ${environment.temperature}`
      : "",

    environment.humidity !==
      undefined &&
    environment.humidity !== null
      ? `Humidity: ${environment.humidity}`
      : "",

    state.body_state
      ? `Body state: ${state.body_state}`
      : "",

    state.energy
      ? `Energy: ${state.energy}`
      : "",

    state.mood
      ? `Mood: ${state.mood}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function parseEmbedding(value) {
  if (Array.isArray(value)) {
    return value.map(Number);
  }

  if (typeof value === "string") {
    return value
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map(Number)
      .filter(Number.isFinite);
  }

  return null;
}

function cosineSimilarity(
  firstVector,
  secondVector
) {
  if (
    !Array.isArray(firstVector) ||
    !Array.isArray(secondVector) ||
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
    index < firstVector.length;
    index += 1
  ) {
    const firstValue =
      Number(firstVector[index]);

    const secondValue =
      Number(secondVector[index]);

    dotProduct +=
      firstValue * secondValue;

    firstNorm +=
      firstValue * firstValue;

    secondNorm +=
      secondValue * secondValue;
  }

  if (!firstNorm || !secondNorm) {
    return 0;
  }

  return (
    dotProduct /
    (
      Math.sqrt(firstNorm) *
      Math.sqrt(secondNorm)
    )
  );
}

function makeWeaveNode(log) {
  const state =
    getObject(log.state);

  const environment =
    getObject(log.environment);

  const work =
    getObject(log.work);

  const artisticInput =
    getObject(log.artistic_input);

  const ai =
    getObject(log.ai_analysis);

  return {
    id: log.id,
    date: log.date,

    project:
      work.project || "",

    summary:
      ai.summary ||
      log.observation ||
      artisticInput.title ||
      "Untitled Daily",

    themes:
      getArray(ai.themes),

    emotions:
      getArray(ai.emotions),

    keywords:
      getArray(ai.keywords),

    body_state:
      state.body_state || "",

    energy:
      state.energy || "",

    mood:
      state.mood || "",

    weather:
      environment.weather || "",

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
  };
}

/*
 * 최근 기록을 이용해 System Reading 생성
 */
async function generateSystemReading(logs) {
  const records =
    logs
      .filter(
        (log) =>
          log.date >=
          getStartDate(
            SYSTEM_PERIOD_DAYS
          )
      )
      .map(cleanLog);

  if (!records.length) {
    return {
      current_mode:
        "Not enough material",

      overview:
        "The system has not gathered enough recent material for a period reading.",

      recurring_signals: [],
      relationships: [],
      shifts: [],

      open_question:
        "What is beginning to repeat?",

      confidence_note:
        "No recent Daily records were available.",
    };
  }

  const response =
    await openai.responses.create({
      model: CHAT_MODEL,

      input: [
        {
          role: "system",

          content: `
You are the period-reading layer of SOFTSYSTEMS.

SOFTSYSTEMS is an artistic ecology that observes relationships among body, weather, practice, memory, artistic input, media, and creation.

Read several Daily records together.

Identify only patterns that are supported by the records.

Pay attention to:
- body state, energy, and mood;
- weather and environmental shifts;
- making and learning rhythms;
- observation and alignment;
- repeated books, films, performances, exhibitions, music, creators, and artistic ideas;
- relationships between artistic input and later making;
- changes across time.

Do not give generic motivation.
Do not praise productivity.
Do not diagnose illness.
Do not claim causation from correlation.
State uncertainty honestly.

Use calm, precise, observational English.
          `.trim(),
        },

        {
          role: "user",

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
          type: "json_schema",
          name:
            "softsystems_system_reading",
          strict: true,
          schema: SYSTEM_SCHEMA,
        },
      },
    });

  if (!response.output_text) {
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
      new Date().toISOString(),

    model:
      CHAT_MODEL,
  };
}

/*
 * Home에 표시할 Soft Suggestion 생성
 */
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
      .map(cleanLog);

  if (!recentLogs.length) {
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
    };
  }

  const response =
    await openai.responses.create({
      model: CHAT_MODEL,

      input: [
        {
          role: "system",

          content: `
You create the daily Soft Suggestion for SOFTSYSTEMS.

SOFTSYSTEMS is not a productivity app.
The suggestion should support the artist's body, attention, and creative ecology.

Use recent records and the latest System reading.

You may notice:
- low body state or energy;
- signs of strain or incomplete recovery;
- weather conditions that previously appeared with particular reactions;
- repeated patterns around making, listening, walking, collecting, editing, resting, or learning;
- artistic inputs that may offer a gentle direction.

Give one small and realistic gesture.

Examples of appropriate gestures:
- take a short walk and collect one sound;
- listen without editing;
- keep making light;
- work near a window;
- reread one marked passage;
- leave the material unorganized today;
- rest or reduce intensity when the records support it.

Do not diagnose illness.
Do not say that weather caused a reaction.
Do not give medical instructions.
Do not give generic productivity advice.
Do not tell the artist to push harder.
Do not invent evidence.

If the data is limited, say so.
Use calm, precise, concise English.
          `.trim(),
        },

        {
          role: "user",

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
          type: "json_schema",
          name:
            "softsystems_daily_guidance",
          strict: true,
          schema: GUIDANCE_SCHEMA,
        },
      },
    });

  if (!response.output_text) {
    throw new Error(
      "The AI returned no guidance."
    );
  }

  return {
    ...JSON.parse(
      response.output_text
    ),

    generated_at:
      new Date().toISOString(),

    model:
      CHAT_MODEL,
  };
}

/*
 * 변경된 Daily만 embedding 갱신하고
 * 의미 연결을 계산한다.
 */
async function generateWeave(logs) {
  const preparedLogs =
    logs
      .slice(-MAX_LOGS)
      .map((log) => ({
        ...log,

        nextEmbeddingText:
          makeEmbeddingText(log),
      }));

  const logsNeedingEmbedding =
    preparedLogs.filter((log) => {
      return (
        !log.embedding ||
        log.embedding_text !==
          log.nextEmbeddingText
      );
    });

  if (
    logsNeedingEmbedding.length > 0
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
        logsNeedingEmbedding[index];

      const embedding =
        embeddingResponse
          .data[index]
          ?.embedding;

      if (!embedding) {
        continue;
      }

      const updatedAt =
        new Date().toISOString();

      log.embedding = embedding;

      log.embedding_text =
        log.nextEmbeddingText;

      log.embedding_updated_at =
        updatedAt;

      const {
        error: updateError,
      } = await supabaseAdmin
        .from("field_logs")
        .update({
          embedding,

          embedding_text:
            log.nextEmbeddingText,

          embedding_updated_at:
            updatedAt,
        })
        .eq("id", log.id);

      if (updateError) {
        throw updateError;
      }
    }
  }

  const usableLogs =
    preparedLogs
      .map((log) => ({
        ...log,

        parsedEmbedding:
          parseEmbedding(
            log.embedding
          ),
      }))
      .filter((log) => {
        return (
          Array.isArray(
            log.parsedEmbedding
          ) &&
          log.parsedEmbedding.length > 0
        );
      });

  const edges = [];

  for (
    let firstIndex = 0;
    firstIndex < usableLogs.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex < usableLogs.length;
      secondIndex += 1
    ) {
      const firstLog =
        usableLogs[firstIndex];

      const secondLog =
        usableLogs[secondIndex];

      const similarity =
        cosineSimilarity(
          firstLog.parsedEmbedding,
          secondLog.parsedEmbedding
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
              similarity.toFixed(4)
            ),
        });
      }
    }
  }

  edges.sort(
    (firstEdge, secondEdge) =>
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
        logsNeedingEmbedding.length,

      threshold:
        MIN_SIMILARITY,

      embedding_model:
        EMBEDDING_MODEL,

      includes_artistic_input:
        true,

      generated_at:
        new Date().toISOString(),
    },
  };
}

/*
 * Vercel Cron은 GET 요청으로 실행한다.
 */
export async function GET(request) {
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
      .from("field_logs")
      .select(
        `
          id,
          user_id,
          date,
          state,
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
      .order("date", {
        ascending: true,
      })
      .limit(MAX_LOGS);

    if (logsError) {
      throw logsError;
    }

    if (!logs?.length) {
      return NextResponse.json(
        {
          success: true,
          message:
            "No public Daily records were found.",
        }
      );
    }

    const snapshotDate =
      getDateString();

    /*
     * 1. System 생성
     */
    const systemReading =
      await generateSystemReading(
        logs
      );

    const {
      error:
        systemSnapshotError,
    } = await supabaseAdmin
      .from("system_snapshots")
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

    if (systemSnapshotError) {
      throw systemSnapshotError;
    }

    /*
     * 2. Soft Suggestion 생성
     */
    const guidance =
      await generateGuidance(
        logs,
        systemReading
      );

    const {
      error:
        guidanceError,
    } = await supabaseAdmin
      .from("daily_guidance")
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

    if (guidanceError) {
      throw guidanceError;
    }

    /*
     * 3. Semantic Weave 생성
     */
    const weave =
      await generateWeave(logs);

    const {
      error:
        weaveSnapshotError,
    } = await supabaseAdmin
      .from("weave_snapshots")
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

    if (weaveSnapshotError) {
      throw weaveSnapshotError;
    }

    return NextResponse.json({
      success: true,

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
        success: false,

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
