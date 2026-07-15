import { NextResponse } from "next/server";

import { openai } from "../../../lib/openai";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const CHAT_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5.6";

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ||
  "text-embedding-3-small";

const EMBEDDING_DIMENSIONS = 1536;

const MAX_ARCHIVE_MATCHES = 5;
const MAX_ARCHIVE_CANDIDATES = 200;
const MIN_ARCHIVE_SIMILARITY = 0.35;
const MAX_ARCHIVE_BODY_LENGTH = 3000;
const MAX_SEARCH_TEXT_LENGTH = 24000;

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
    getObject(
      log.artistic_input
    );

  const aiAnalysis =
    getObject(
      log.ai_analysis
    );

  return {
    date:
      log.date || "",

    body: {
      body_state:
        state.body_state ??
        null,

      energy:
        state.energy ??
        null,

      mood:
        state.mood ??
        null,

      weight:
        state.weight ??
        null,

      temperature:
        state.temperature ??
        null,
    },

    body_moving: {
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

function makeSystemSearchText(
  logs
) {
  const text =
    logs
      .map((log) => {
        const cleaned =
          cleanLog(log);

        const makingNotes =
          getArray(
            cleaned.making
              .notes
          ).join("\n");

        const learning =
          getArray(
            cleaned.learning
          ).join("\n");

        const tomorrow =
          getArray(
            cleaned.tomorrow
          ).join("\n");

        const themes =
          getArray(
            cleaned.ai_analysis
              ?.themes
          ).join(", ");

        const keywords =
          getArray(
            cleaned.ai_analysis
              ?.keywords
          ).join(", ");

        return [
          cleaned.date
            ? `Date: ${cleaned.date}`
            : "",

          cleaned.body
            .body_state !==
            null
            ? `Body state: ${cleaned.body.body_state}`
            : "",

          cleaned.body
            .energy !== null
            ? `Energy: ${cleaned.body.energy}`
            : "",

          cleaned.body
            .mood !== null
            ? `Mood: ${cleaned.body.mood}`
            : "",

          cleaned.body_moving
            .type
            ? `Body Moving type: ${cleaned.body_moving.type}`
            : "",

          cleaned.body_moving
            .time
            ? `Body Moving time: ${cleaned.body_moving.time}`
            : "",

          cleaned.body_moving
            .notes
            ? `Body Moving notes: ${cleaned.body_moving.notes}`
            : "",

          cleaned.environment
            ?.weather
            ? `Weather: ${cleaned.environment.weather}`
            : "",

          cleaned.making
            .project
            ? `Making project: ${cleaned.making.project}`
            : "",

          cleaned.making
            .time
            ? `Making time: ${cleaned.making.time}`
            : "",

          makingNotes
            ? `Making notes:\n${makingNotes}`
            : "",

          learning
            ? `Learning:\n${learning}`
            : "",

          cleaned.artistic_input
            .title
            ? `Artistic input: ${cleaned.artistic_input.title}`
            : "",

          cleaned.artistic_input
            .creator
            ? `Artistic input creator: ${cleaned.artistic_input.creator}`
            : "",

          cleaned.artistic_input
            .note
            ? `Artistic input note: ${cleaned.artistic_input.note}`
            : "",

          cleaned.observation
            ? `Observation: ${cleaned.observation}`
            : "",

          cleaned.alignment
            ? `Alignment: ${cleaned.alignment}`
            : "",

          tomorrow
            ? `Tomorrow:\n${tomorrow}`
            : "",

          cleaned.ai_analysis
            ?.summary
            ? `AI summary: ${cleaned.ai_analysis.summary}`
            : "",

          cleaned.ai_analysis
            ?.relationship
            ? `AI relationship: ${cleaned.ai_analysis.relationship}`
            : "",

          themes
            ? `Themes: ${themes}`
            : "",

          keywords
            ? `Keywords: ${keywords}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n---\n\n");

  return text.slice(
    0,
    MAX_SEARCH_TEXT_LENGTH
  );
}

function parseEmbedding(value) {
  if (
    Array.isArray(value)
  ) {
    const parsed =
      value.map(Number);

    return parsed.every(
      Number.isFinite
    )
      ? parsed
      : null;
  }

  if (
    typeof value ===
    "string"
  ) {
    const parsed =
      value
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .split(",")
        .map((item) =>
          Number(
            item.trim()
          )
        );

    return parsed.length &&
      parsed.every(
        Number.isFinite
      )
      ? parsed
      : null;
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

    if (
      !Number.isFinite(
        firstValue
      ) ||
      !Number.isFinite(
        secondValue
      )
    ) {
      return 0;
    }

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

function cleanArchiveEntry(
  entry,
  similarity
) {
  return {
    id:
      entry.id,

    type:
      entry.type ||
      "",

    title:
      entry.title ||
      "",

    entry_date:
      entry.entry_date ||
      "",

    body:
      String(
        entry.body ||
        ""
      ).slice(
        0,
        MAX_ARCHIVE_BODY_LENGTH
      ),

    url:
      entry.url ||
      "",

    tags:
      getArray(
        entry.tags
      ),

    similarity:
      Number(
        similarity.toFixed(
          4
        )
      ),
  };
}

async function findRelevantArchive({
  userId,
  logs,
}) {
  const searchText =
    makeSystemSearchText(
      logs
    );

  if (!searchText) {
    return [];
  }

  const embeddingResponse =
    await openai.embeddings.create({
      model:
        EMBEDDING_MODEL,

      input:
        searchText,

      dimensions:
        EMBEDDING_DIMENSIONS,
    });

  const queryEmbedding =
    embeddingResponse
      .data?.[0]
      ?.embedding;

  if (
    !Array.isArray(
      queryEmbedding
    ) ||
    queryEmbedding.length !==
      EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      "The Archive search embedding was not returned correctly."
    );
  }

  const {
    data: archiveEntries,
    error: archiveError,
  } = await supabaseAdmin
    .from(
      "archive_entries"
    )
    .select(
      `
        id,
        user_id,
        type,
        title,
        entry_date,
        body,
        url,
        tags,
        is_public,
        embedding,
        embedding_text,
        embedding_updated_at
      `
    )
    .eq(
      "user_id",
      userId
    )
    .not(
      "embedding",
      "is",
      null
    )
    .order(
      "entry_date",
      {
        ascending: false,
      }
    )
    .limit(
      MAX_ARCHIVE_CANDIDATES
    );

  if (archiveError) {
    throw archiveError;
  }

  const matches =
    (archiveEntries || [])
      .map((entry) => {
        const archiveEmbedding =
          parseEmbedding(
            entry.embedding
          );

        if (
          !archiveEmbedding
        ) {
          return null;
        }

        const similarity =
          cosineSimilarity(
            queryEmbedding,
            archiveEmbedding
          );

        return {
          entry,
          similarity,
        };
      })
      .filter(Boolean)
      .filter(
        (item) =>
          item.similarity >=
          MIN_ARCHIVE_SIMILARITY
      )
      .sort(
        (
          first,
          second
        ) =>
          second.similarity -
          first.similarity
      )
      .slice(
        0,
        MAX_ARCHIVE_MATCHES
      )
      .map((item) =>
        cleanArchiveEntry(
          item.entry,
          item.similarity
        )
      );

  return matches;
}

export async function POST(
  request
) {
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

    let requestBody = {};

    try {
      requestBody =
        await request.json();
    } catch {
      requestBody = {};
    }

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

    startDate.setUTCDate(
      startDate.getUTCDate() -
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
      .from(
        "field_logs"
      )
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

    let relevantArchive = [];
    let archiveSearchNote = "";

    try {
      relevantArchive =
        await findRelevantArchive({
          userId:
            userData.user.id,

          logs,
        });
    } catch (
      archiveSearchError
    ) {
      console.error(
        "Archive search failed:",
        archiveSearchError
      );

      archiveSearchNote =
        "Archive search could not be completed for this reading.";
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

      relevant_archive:
        relevantArchive,

      archive_context: {
        matched_count:
          relevantArchive.length,

        selection_method:
          "Semantic similarity between the recent Daily period and Archive embeddings.",

        note:
          archiveSearchNote,
      },
    };

    const response =
      await openai.responses.create({
        model:
          CHAT_MODEL,

        input: [
          {
            role:
              "system",

            content: `
You are the interpretive layer of SOFTSYSTEMS.

SOFTSYSTEMS is an artistic ecology that observes relationships among body, Body Moving, environment, making, learning, artistic input, Archive memory, media, and creation.

You are analyzing several recent Daily records together with a small set of semantically relevant Archive entries.

Daily records describe recent lived conditions and activities.

Archive entries may include essays, reflections, project logs, videos, and references. They represent contextual memory, earlier thoughts, artistic language, and longer-term concerns.

Important Archive rules:
- Archive writing is contextual memory, not definitive proof of the artist's present beliefs.
- Do not assume that an older Archive statement is still current.
- Do not force recent Daily records to agree with Archive writing.
- When recent records differ from older Archive material, describe the shift, tension, revision, or distance.
- Do not claim that an Archive entry caused a later body state, action, or artwork.
- Use Archive material only when it genuinely clarifies a recurring concern, language, question, or artistic relationship.
- Cite Archive evidence in plain language by naming its title when relevant.
- Do not mention similarity scores unless uncertainty makes them useful.

Body Moving describes what the body actually did during the day. It may include yoga, walking, running, stretching, strength work, swimming, cycling, dance, performance practice, housework, or another embodied activity.

Artistic Input may include a book, film, performance, exhibition, music work, or another artistic reference.

Your task:
- identify recurring signals supported by multiple recent records;
- identify changes across time;
- identify careful relationships among body state, Body Moving, environment, making, learning, artistic input, observation, and Archive memory;
- notice repeated relationships among movement, recovery, energy, mood, making, and learning;
- notice recurring artists, works, creators, media types, ideas, and artistic concerns;
- notice when a recent observation echoes, revises, contradicts, or develops an earlier Archive thought;
- distinguish direct evidence from interpretation;
- avoid generic motivation;
- avoid productivity coaching;
- avoid medical diagnosis;
- do not claim causation from correlation;
- do not infer a stable pattern from one record;
- do not invent patterns unsupported by the supplied material.

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

        archive_match_count:
          relevantArchive.length,

        archive_titles:
          relevantArchive.map(
            (entry) =>
              entry.title
          ),

        generated_at:
          new Date()
            .toISOString(),

        model:
          CHAT_MODEL,

        embedding_model:
          EMBEDDING_MODEL,
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
