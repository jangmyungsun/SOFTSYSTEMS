import { NextResponse } from "next/server";

import { openai } from "../../../lib/openai";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ||
  "text-embedding-3-small";

const MAX_LOGS = 100;
const MAX_EDGES = 80;
const MIN_SIMILARITY = 0.72;

function makeEmbeddingText(log) {
  const ai =
    log.ai_analysis &&
    typeof log.ai_analysis === "object"
      ? log.ai_analysis
      : {};

  const themes = Array.isArray(ai.themes)
    ? ai.themes.join(", ")
    : "";

  const emotions = Array.isArray(ai.emotions)
    ? ai.emotions.join(", ")
    : "";

  const keywords = Array.isArray(ai.keywords)
    ? ai.keywords.join(", ")
    : "";

  const bodySignals = Array.isArray(ai.body_signals)
    ? ai.body_signals.join(", ")
    : "";

  const practiceSignals = Array.isArray(
    ai.practice_signals
  )
    ? ai.practice_signals.join(", ")
    : "";

  const makingItems = Array.isArray(
    log.work?.items
  )
    ? log.work.items.join("\n")
    : "";

  const learning = Array.isArray(log.learning)
    ? log.learning.join("\n")
    : "";

  return [
    `Date: ${log.date || ""}`,
    `Project: ${log.work?.project || ""}`,
    `Making: ${makingItems}`,
    `Learning: ${learning}`,
    `Observation: ${log.observation || ""}`,
    `Alignment: ${log.alignment || ""}`,
    `AI summary: ${ai.summary || ""}`,
    `AI relationship: ${ai.relationship || ""}`,
    `Themes: ${themes}`,
    `Emotions: ${emotions}`,
    `Keywords: ${keywords}`,
    `Body signals: ${bodySignals}`,
    `Practice signals: ${practiceSignals}`,
    `Weather: ${log.environment?.weather || ""}`,
    `Body state: ${log.state?.body_state || ""}`,
    `Energy: ${log.state?.energy || ""}`,
    `Mood: ${log.state?.mood || ""}`,
  ]
    .filter((line) => !line.endsWith(": "))
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
      .map(Number);
  }

  return null;
}

function cosineSimilarity(a, b) {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length !== b.length
  ) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function makeNode(log) {
  const ai =
    log.ai_analysis &&
    typeof log.ai_analysis === "object"
      ? log.ai_analysis
      : {};

  return {
    id: log.id,
    date: log.date,
    project: log.work?.project || "",
    summary:
      ai.summary ||
      log.observation ||
      "Untitled Daily",
    themes: Array.isArray(ai.themes)
      ? ai.themes
      : [],
    emotions: Array.isArray(ai.emotions)
      ? ai.emotions
      : [],
    body_state: log.state?.body_state || "",
    energy: log.state?.energy || "",
    weather: log.environment?.weather || "",
  };
}

export async function POST(request) {
  try {
    const authorization =
      request.headers.get("authorization");

    const accessToken =
      authorization?.startsWith("Bearer ")
        ? authorization.slice(7)
        : "";

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Authentication is required.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: userData,
      error: userError,
    } = await supabaseAdmin.auth.getUser(
      accessToken
    );

    if (userError || !userData?.user) {
      return NextResponse.json(
        {
          error: "Invalid authentication.",
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
      .select(`
        id,
        date,
        state,
        environment,
        work,
        learning,
        observation,
        alignment,
        ai_analysis,
        embedding,
        embedding_text,
        embedding_updated_at
      `)
      .eq("user_id", userData.user.id)
      .eq("is_public", true)
      .order("date", {
        ascending: true,
      })
      .limit(MAX_LOGS);

    if (logsError) {
      throw logsError;
    }

    if (!logs || logs.length < 2) {
      return NextResponse.json(
        {
          error:
            "At least two Daily records are needed.",
        },
        {
          status: 400,
        }
      );
    }

    const preparedLogs = logs.map((log) => ({
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

    if (logsNeedingEmbedding.length > 0) {
      const embeddingResponse =
        await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: logsNeedingEmbedding.map(
            (log) => log.nextEmbeddingText
          ),
        });

      for (
        let index = 0;
        index < logsNeedingEmbedding.length;
        index += 1
      ) {
        const log =
          logsNeedingEmbedding[index];

        const embedding =
          embeddingResponse.data[index]
            ?.embedding;

        if (!embedding) {
          continue;
        }

        log.embedding = embedding;
        log.embedding_text =
          log.nextEmbeddingText;
        log.embedding_updated_at =
          new Date().toISOString();

        const {
          error: updateError,
        } = await supabaseAdmin
          .from("field_logs")
          .update({
            embedding,
            embedding_text:
              log.nextEmbeddingText,
            embedding_updated_at:
              log.embedding_updated_at,
          })
          .eq("id", log.id)
          .eq(
            "user_id",
            userData.user.id
          );

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
            parseEmbedding(log.embedding),
        }))
        .filter(
          (log) =>
            Array.isArray(
              log.parsedEmbedding
            ) &&
            log.parsedEmbedding.length >
              0
        );

    const edges = [];

    for (
      let first = 0;
      first < usableLogs.length;
      first += 1
    ) {
      for (
        let second = first + 1;
        second < usableLogs.length;
        second += 1
      ) {
        const similarity =
          cosineSimilarity(
            usableLogs[first]
              .parsedEmbedding,
            usableLogs[second]
              .parsedEmbedding
          );

        if (
          similarity >=
          MIN_SIMILARITY
        ) {
          edges.push({
            source:
              usableLogs[first].id,
            target:
              usableLogs[second].id,
            similarity:
              Number(
                similarity.toFixed(4)
              ),
          });
        }
      }
    }

    edges.sort(
      (a, b) =>
        b.similarity -
        a.similarity
    );

    return NextResponse.json({
      nodes:
        usableLogs.map(makeNode),

      edges:
        edges.slice(0, MAX_EDGES),

      meta: {
        record_count:
          usableLogs.length,

        generated_embeddings:
          logsNeedingEmbedding.length,

        threshold:
          MIN_SIMILARITY,

        embedding_model:
          EMBEDDING_MODEL,

        generated_at:
          new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Semantic Weave failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Semantic Weave failed.",
      },
      {
        status: 500,
      }
    );
  }
}
