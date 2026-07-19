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

    tags:
      normalizeTags(
        entry.tags
      ),

    is_public:
      entry.is_public !==
      false,
  };
}

function compareArchiveEntries(left, right) {
  const leftUpdated =
    String(
      left?.updated_at ||
        ""
    );

  const rightUpdated =
    String(
      right?.updated_at ||
        ""
    );

  if (
    leftUpdated !==
    rightUpdated
  ) {
    return rightUpdated.localeCompare(
      leftUpdated
    );
  }

  const leftCreated =
    String(
      left?.created_at ||
        ""
    );

  const rightCreated =
    String(
      right?.created_at ||
        ""
    );

  if (
    leftCreated !==
    rightCreated
  ) {
    return rightCreated.localeCompare(
      leftCreated
    );
  }

  const leftDate =
    String(
      left?.entry_date ||
        ""
    );

  const rightDate =
    String(
      right?.entry_date ||
        ""
    );

  if (leftDate !== rightDate) {
    return rightDate.localeCompare(
      leftDate
    );
  }

  return String(
    right?.id || ""
  ).localeCompare(
    String(
      left?.id || ""
    )
  );
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

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data,
        error,
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          "Input auth error:",
          error
        );
      }

      setUser(
        data?.user ||
          null
      );

      setAuthLoading(false);
    }

    loadUser();

    const {
      data:
        authListener,
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          if (!mounted) {
            return;
          }

          setUser(
            session?.user ||
              null
          );

          setAuthLoading(false);
        }
      );

    return () => {
      mounted = false;

      authListener
        ?.subscription
        ?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    async function loadInputPreview() {
      setLoading(true);
      setErrorMessage("");

      try {
        let archiveItemsQuery =
          supabase
            .from(
              "archive_items"
            )
            .select("*")
            .order(
              "updated_at",
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
            .limit(12);

        let archiveEntriesQuery =
          supabase
            .from(
              "archive_entries"
            )
            .select("*")
            .order(
              "updated_at",
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
            .limit(12);

        if (!user) {
          archiveItemsQuery =
            archiveItemsQuery.eq(
              "is_public",
              true
            );

          archiveEntriesQuery =
            archiveEntriesQuery.eq(
              "is_public",
              true
            );
        }

        const [
          archiveItemsResult,
          archiveEntriesResult,
          dailyResult,
        ] =
          await Promise.all([
            archiveItemsQuery,

            archiveEntriesQuery,

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
          archiveItemsResult.error &&
          archiveEntriesResult.error
        ) {
          throw archiveItemsResult.error;
        }

        if (
          dailyResult.error
        ) {
          throw dailyResult.error;
        }

        setLatestArchives(
          [
            ...(
              archiveItemsResult.data ||
              []
            ),
            ...(
              archiveEntriesResult.data ||
              []
            ),
          ]
            .map(
              normalizeArchiveEntry
            )
            .filter(Boolean)
            .sort(
              compareArchiveEntries
            )
            .slice(0, 3)
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
  }, [
    authLoading,
    user,
  ]);

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
                  {t("input.viewAll")}
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
                  {t("input.viewAll")}
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
                  {t("input.noDailyRecords")}
                </p>
              )}
            </section>
          </>
        )}
    </>
  );
}
