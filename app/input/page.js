"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "../../lib/supabaseClient";

import { useLanguage } from "../../components/LanguageProvider";
import ArchiveCard from "../../components/ArchiveCard";
import EntryCard from "../../components/EntryCard";

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
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

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
            t("input.loadError")
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
          {t("input.title")}
        </p>

        <h2>
          {t("input.heading")}
        </h2>

        <p className="subtitle">
          {t("input.subtitle")}
        </p>
      </section>

      {loading && (
        <section className="panel">
          <p className="muted">
            {t("input.loading")}
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
                    {t("input.archive")}
                  </p>

                  <h2>
                    {t("input.latestArchive")}
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
                  {t("input.noArchiveEntries")}
                </p>
              )}
            </section>

            <section className="panel">
              <div className="entry-head">
                <div>
                  <p className="eyebrow">
                    {t("input.daily")}
                  </p>

                  <h2>
                    {t("input.latestDaily")}
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
