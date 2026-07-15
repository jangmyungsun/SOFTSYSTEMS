import { NextResponse } from "next/server";

import { openai } from "../../../lib/openai";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ||
  "text-embedding-3-small";

const MAX_LOGS = 100;
const MAX_EDGES = 80;
const MIN_SIMILARITY = 0.72;

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

function makeEmbeddingText(log) {
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
  if (Array.isArray(value)) {
    return value
      .map(Number)
      .filter(
        Number.isFinite
      );
  }

  if (
    typeof value === "string"
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
     * 기존 snapshot 및 화면 코드와의
     * 호환성을 위해 당분간 함께 저장한다.
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
     * 이전 Weave 화면이
     * node.project를 직접 읽으므로 유지한다.
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
        ? authorization.slice(
            7
          )
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
        "user_id",
        userData.user.id
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

    if (logsError) {
      throw logsError;
    }

    if (
      !logs ||
      logs.length < 2
    ) {
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

    const preparedLogs =
      logs.map(
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
          .eq(
            "id",
            log.id
          )
          .eq(
            "user_id",
            userData.user.id
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

    const nodes =
      usableLogs.map(
        makeWeaveNode
      );

    const result = {
      nodes,

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

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "Semantic Weave failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Semantic Weave failed.",
      },
      {
        status: 500,
      }
    );
  }
}
