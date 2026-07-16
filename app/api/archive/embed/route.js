import { NextResponse } from "next/server";

import { openai } from "../../../../lib/openai";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ||
  "text-embedding-3-small";

const EMBEDDING_DIMENSIONS = 1536;
const MAX_BATCH_SIZE = 100;
const MAX_TEXT_LENGTH = 24000;

function getSafeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function makeEmbeddingText(entry) {
  const tags = getSafeArray(
    entry.tags
  )
    .map((tag) =>
      String(tag).trim()
    )
    .filter(Boolean)
    .join(", ");

  const sections = [
    entry.type
      ? `Archive type: ${entry.type}`
      : "",

    entry.title
      ? `Title: ${entry.title}`
      : "",

    entry.entry_date
      ? `Date: ${entry.entry_date}`
      : "",

    tags
      ? `Tags: ${tags}`
      : "",

    entry.body
      ? `Content:\n${entry.body}`
      : "",

    entry.url
      ? `Reference URL: ${entry.url}`
      : "",
  ];

  return sections
    .filter(Boolean)
    .join("\n\n")
    .slice(
      0,
      MAX_TEXT_LENGTH
    );
}

function normalizeArchiveEntry(
  entry
) {
  return {
    ...entry,

    entry_date:
      entry?.entry_date ||
      entry?.date ||
      "",

    body:
      entry?.body ||
      entry?.notes ||
      "",

    url:
      entry?.url ||
      entry?.link ||
      entry?.file_url ||
      "",
  };
}

async function loadEntriesFromTable({
  tableName,
  dateColumn,
  userId,
  entryId,
  embedAll,
}) {
  let query =
    supabaseAdmin
      .from(tableName)
      .select("*")
      .eq("user_id", userId);

  if (entryId) {
    query = query.eq(
      "id",
      entryId
    );
  } else if (embedAll) {
    query = query
      .order(dateColumn, {
        ascending: true,
      })
      .limit(MAX_BATCH_SIZE);
  } else {
    throw new Error(
      "Provide entry_id or set all to true."
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    if (tableName === "archive_entries") {
      console.warn(
        "Archive embed lookup failed:",
        {
          table: tableName,
          entryId: entryId || "",
          all: embedAll,
          error: error.message,
        }
      );

      return [];
    }

    throw error;
  }

  console.info(
    "Archive embed lookup:",
    {
      table: tableName,
      entryId: entryId || "",
      all: embedAll,
      found: (data || []).length,
    }
  );

  return (data || []).map(
    normalizeArchiveEntry
  );
}

async function getAuthenticatedUser(
  request
) {
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
    return {
      user: null,
      error:
        "Authentication is required.",
    };
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken
    );

  if (
    error ||
    !data?.user
  ) {
    return {
      user: null,
      error:
        "Invalid authentication.",
    };
  }

  return {
    user: data.user,
    error: "",
  };
}

async function loadEntries({
  userId,
  entryId,
  embedAll,
}) {
  const [archiveItems, legacyEntries] =
    await Promise.all([
      loadEntriesFromTable({
        tableName:
          "archive_items",

        dateColumn: "date",

        userId,

        entryId,

        embedAll,
      }),

      loadEntriesFromTable({
        tableName:
          "archive_entries",

        dateColumn:
          "entry_date",

        userId,

        entryId,

        embedAll,
      }),
    ]);

  const mergedEntries = new Map();

  [...archiveItems, ...legacyEntries].forEach(
    (entry) => {
      if (!entry?.id) {
        return;
      }

      mergedEntries.set(
        entry.id,
        entry
      );
    }
  );

  return Array.from(
    mergedEntries.values()
  );
}

export async function POST(
  request
) {
  try {
    const {
      user,
      error:
        authenticationError,
    } =
      await getAuthenticatedUser(
        request
      );

    if (
      authenticationError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            authenticationError,
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

    const entryId =
      typeof requestBody.entry_id ===
      "string"
        ? requestBody.entry_id.trim()
        : "";

    const embedAll =
      requestBody.all === true;

    const force =
      requestBody.force === true;

    const entries =
      await loadEntries({
        userId:
          user.id,

        entryId,

        embedAll,
      });

    if (!entries.length) {
      return NextResponse.json(
        {
          error:
            entryId
              ? "Archive entry not found."
              : "No Archive entries were found.",
        },
        {
          status: 404,
        }
      );
    }

    const preparedEntries =
      entries.map(
        (entry) => {
          const nextEmbeddingText =
            makeEmbeddingText(
              entry
            );

          const textChanged =
            entry.embedding_text !==
            nextEmbeddingText;

          const needsEmbedding =
            force ||
            !entry.embedding ||
            textChanged;

          return {
            ...entry,

            nextEmbeddingText,

            needsEmbedding,
          };
        }
      );

    const entriesToEmbed =
      preparedEntries.filter(
        (entry) =>
          entry.needsEmbedding &&
          entry.nextEmbeddingText
      );

    if (
      !entriesToEmbed.length
    ) {
      return NextResponse.json({
        success: true,

        processed: 0,

        skipped:
          preparedEntries.length,

        message:
          "All selected Archive entries already have current embeddings.",

        model:
          EMBEDDING_MODEL,
      });
    }

    const embeddingResponse =
      await openai.embeddings.create({
        model:
          EMBEDDING_MODEL,

        input:
          entriesToEmbed.map(
            (entry) =>
              entry.nextEmbeddingText
          ),

        dimensions:
          EMBEDDING_DIMENSIONS,
      });

    const updatedIds = [];
    const failedEntries = [];

    for (
      let index = 0;
      index <
      entriesToEmbed.length;
      index += 1
    ) {
      const entry =
        entriesToEmbed[index];

      const embedding =
        embeddingResponse
          .data[index]
          ?.embedding;

      if (
        !Array.isArray(
          embedding
        ) ||
        embedding.length !==
          EMBEDDING_DIMENSIONS
      ) {
        failedEntries.push({
          id:
            entry.id,

          title:
            entry.title,

          error:
            "The embedding response was missing or had the wrong dimensions.",
        });

        continue;
      }

      const updatedAt =
        new Date()
          .toISOString();

      const {
        error:
          updateError,
      } = await supabaseAdmin
        .from(
          "archive_entries"
        )
        .update({
          embedding,

          embedding_text:
            entry.nextEmbeddingText,

          embedding_updated_at:
            updatedAt,
        })
        .eq(
          "id",
          entry.id
        )
        .eq(
          "user_id",
          user.id
        );

      if (updateError) {
        failedEntries.push({
          id:
            entry.id,

          title:
            entry.title,

          error:
            updateError.message,
        });

        continue;
      }

      updatedIds.push(
        entry.id
      );
    }

    const skippedCount =
      preparedEntries.length -
      entriesToEmbed.length;

    return NextResponse.json({
      success:
        failedEntries.length ===
        0,

      processed:
        updatedIds.length,

      skipped:
        skippedCount,

      failed:
        failedEntries.length,

      updated_ids:
        updatedIds,

      failures:
        failedEntries,

      model:
        EMBEDDING_MODEL,

      dimensions:
        EMBEDDING_DIMENSIONS,
    });
  } catch (error) {
    console.error(
      "Archive embedding failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Archive embedding failed.",
      },
      {
        status: 500,
      }
    );
  }
}
