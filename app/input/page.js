"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "../../lib/supabaseClient";

import ArchiveCard from "../../components/ArchiveCard";
import EntryCard from "../../components/EntryCard";

const INPUT_ITEMS = [
  {
    href: "/archive",
    eyebrow: "Archive",
    title: "Writing and Media",
    description:
      "Essays, reflections, project logs, videos, and references collected as a long-term memory layer.",
    action: "Open Archive",
  },

  {
    href: "/daily",
    eyebrow: "Daily",
    title: "Body and Practice",
    description:
      "Body state, environment, Body Moving, making, learning, artistic input, observation, and daily attachments.",
    action: "Open Daily",
  },
];

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeArchiveEntry(entry) {
  if (!entry) {
    return null;
  }

  return {
    ...entry,

    tags:
      normalizeTags(
        entry.tags
      ),

    is_public:
      entry.is_public !==
      false,
  };
}

export default function InputPage() {
  const [
    latestArchives,
    setLatestArchives,
  ] = useState([]);

  const [
    latestDaily,
    setLatestDaily,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    async function loadInputPreview() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [
          archiveResult,
          dailyResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "archive_entries"
              )
              .select("*")
              .eq(
                "is_public",
                true
              )
              .order(
                "entry_date",
                {
                  ascending:
                    false,
                }
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              )
              .limit(3),

            supabase
              .from(
                "field_logs"
              )
              .select("*")
              .eq(
                "is_public",
                true
              )
              .order(
                "date",
                {
                  ascending:
                    false,
                }
              )
              .limit(1)
              .maybeSingle(),
          ]);

        if (
          archiveResult.error
        ) {
          throw archiveResult.error;
        }

        if (
          dailyResult.error
        ) {
          throw dailyResult.error;
        }

        setLatestArchives(
          (
            archiveResult.data ||
            []
          )
            .map(
              normalizeArchiveEntry
            )
            .filter(Boolean)
        );

        setLatestDaily(
          dailyResult.data ||
          null
        );
      } catch (error) {
        console.error(
          "Input preview load error:",
          error
        );

        setLatestArchives(
          []
        );

        setLatestDaily(
          null
        );

        setErrorMessage(
          error?.message ||
            "The latest Input records could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInputPreview();
  }, []);

  return (
    <>
      <section className="panel">
        <p className="eyebrow">
          Input
        </p>

        <h2>
          Records entering the
          system
        </h2>

        <p className="subtitle">
          Archive holds longer
          thoughts and media.
          Daily records changing
          conditions of the body,
          environment, and
          artistic practice.
        </p>
      </section>

      <section className="grid two">
        {INPUT_ITEMS.map(
          (item) => (
            <article
              className="panel"
              key={item.href}
            >
              <p className="eyebrow">
                {item.eyebrow}
              </p>

              <h2>
                {item.title}
              </h2>

              <p className="subtitle">
                {
                  item.description
                }
              </p>

              <div className="actions">
                <Link
                  href={item.href}
                  className="primary"
                >
                  {item.action}
                </Link>
              </div>
            </article>
          )
        )}
      </section>

      {loading && (
        <section className="panel">
          <p className="muted">
            Loading the latest
            Input…
          </p>
        </section>
      )}

      {!loading &&
        errorMessage && (
          <section className="panel">
            <p className="muted">
              {errorMessage}
            </p>
          </section>
        )}

      {!loading &&
        !errorMessage && (
          <>
            <section className="panel">
              <div className="entry-head">
                <div>
                  <p className="eyebrow">
                    Archive
                  </p>

                  <h2>
                    Latest Archive
                  </h2>
                </div>

                <Link href="/archive">
                  View All
                </Link>
              </div>

              {latestArchives.length >
              0 ? (
                <div className="archive-grid">
                  {latestArchives.map(
                    (entry) => (
                      <ArchiveCard
                        key={
                          entry.id
                        }
                        entry={
                          entry
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <p className="muted">
                  No public Archive
                  entries yet.
                </p>
              )}
            </section>

            <section className="panel">
              <div className="entry-head">
                <div>
                  <p className="eyebrow">
                    Daily
                  </p>

                  <h2>
                    Latest Daily
                  </h2>
                </div>

                <Link href="/daily">
                  View All
                </Link>
              </div>

              {latestDaily ? (
                <EntryCard
                  log={
                    latestDaily
                  }
                />
              ) : (
                <p className="muted">
                  No public Daily
                  entries yet.
                </p>
              )}
            </section>
          </>
        )}
    </>
  );
}
