"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  getHomeState,
} from "../lib/utils";

import { useLanguage } from "../components/LanguageProvider";
import EntryCard from "../components/EntryCard";
import ArchiveCard from "../components/ArchiveCard";
import TranslateButton from "../components/TranslateButton";

function toValueKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseDurationToHours(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const text = String(value)
    .trim()
    .toLowerCase();

  if (!text) {
    return 0;
  }

  const directNumber =
    Number(text);

  if (
    Number.isFinite(
      directNumber
    )
  ) {
    return directNumber;
  }

  let totalHours = 0;

  const hourMatch =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/
    );

  const minuteMatch =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/
    );

  if (hourMatch) {
    totalHours +=
      Number(
        hourMatch[1]
      );
  }

  if (minuteMatch) {
    totalHours +=
      Number(
        minuteMatch[1]
      ) / 60;
  }

  return Number.isFinite(
    totalHours
  )
    ? totalHours
    : 0;
}

function isCurrentMonth(dateValue) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(
    `${dateValue}T12:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  const now =
    new Date();

  return (
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth()
  );
}

function getMovementAverage(logs) {
  const today =
    new Date();

  const elapsedDays =
    Math.max(
      1,
      today.getDate()
    );

  const monthLogs =
    logs.filter(
      (log) =>
        isCurrentMonth(
          log.date
        )
    );

  const totalHours =
    monthLogs.reduce(
      (sum, log) =>
        sum +
        parseDurationToHours(
          log.movement?.time
        ),
      0
    );

  return (
    totalHours /
    elapsedDays
  );
}

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

function normalizeArchiveType(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  return normalized === "reflection"
    ? "idea"
    : normalized || "idea";
}

function normalizeArchiveEntry(entry) {
  return {
    ...entry,

    type:
      normalizeArchiveType(
        entry?.type
      ),

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
        entry?.tags
      ),

    is_public:
      entry?.is_public !==
      false,
  };
}

function compareArchiveEntries(left, right) {
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
    return rightDate.localeCompare(leftDate);
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

  if (leftCreated !== rightCreated) {
    return rightCreated.localeCompare(leftCreated);
  }

  return String(
    right?.id || ""
  ).localeCompare(
    String(
      left?.id || ""
    )
  );
}

async function loadAttachmentMap(
  archiveIds = []
) {
  const filteredIds = Array.from(
    new Set(
      archiveIds
        .map((value) =>
          String(value || "").trim()
        )
        .filter(Boolean)
    )
  );

  if (!filteredIds.length) {
    return new Map();
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "archive_attachments"
    )
    .select(
      "id, archive_id, original_filename, mime_type, size_bytes, attachment_type, created_at"
    )
    .in(
      "archive_id",
      filteredIds
    );

  if (error) {
    if (error.code === "PGRST205") {
      return new Map();
    }

    throw error;
  }

  const map = new Map();

  (data || []).forEach(
    (attachment) => {
      const archiveId = String(
        attachment.archive_id ||
          ""
      ).trim();

      if (!archiveId) {
        return;
      }

      if (!map.has(archiveId)) {
        map.set(
          archiveId,
          []
        );
      }

      map
        .get(archiveId)
        .push(attachment);
    }
  );

  return map;
}

export default function Home() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    archiveEntries,
    setArchiveEntries,
  ] = useState([]);

  const [
    guidance,
    setGuidance,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const getAccessToken =
    async () => {
      const {
        data,
      } = await supabase.auth.getSession();

      return (
        data?.session
          ?.access_token ||
        ""
      );
    };

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
          "Home auth error:",
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

    async function loadHome() {
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
              "date",
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
          logsResult,
          archiveItemsResult,
          archiveEntriesResult,
          guidanceResult,
        ] =
          await Promise.all([
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
              ),

            archiveItemsQuery,

            archiveEntriesQuery,

            supabase
              .from(
                "daily_guidance"
              )
              .select(
                `
                  guidance_date,
                  guidance,
                  generated_at,
                  is_public
                `
              )
              .eq(
                "is_public",
                true
              )
              .order(
                "guidance_date",
                {
                  ascending:
                    false,
                }
              )
              .limit(1)
              .maybeSingle(),
          ]);

        if (logsResult.error) {
          throw logsResult.error;
        }

        if (
          archiveItemsResult.error &&
          archiveEntriesResult.error
        ) {
          throw archiveItemsResult.error;
        }

        if (guidanceResult.error) {
          throw guidanceResult.error;
        }

        setLogs(
          logsResult.data || []
        );

        const mergedArchives = [
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
          .sort(
            compareArchiveEntries
          )
          .slice(0, 3);

        try {
          const attachmentMap =
            await loadAttachmentMap(
              mergedArchives
                .map(
                  (entry) =>
                    entry.id
                )
                .filter(Boolean)
            );

          setArchiveEntries(
            mergedArchives.map(
              (entry) => ({
                ...entry,
                attachments:
                  attachmentMap.get(
                    String(
                      entry.id ||
                        ""
                    )
                  ) || [],
              })
            )
          );
        } catch (
          attachmentError
        ) {
          console.warn(
            "Home attachment load warning:",
            attachmentError
          );

          setArchiveEntries(
            mergedArchives
          );
        }

        const guidanceRow =
          guidanceResult.data;

        const guidanceValue =
          guidanceRow?.guidance &&
          typeof guidanceRow
            .guidance ===
            "object" &&
          !Array.isArray(
            guidanceRow.guidance
          )
            ? guidanceRow.guidance
            : null;

        setGuidance(
          guidanceValue
        );
      } catch (error) {
        console.error(
          "Home load error:",
          error
        );

        setErrorMessage(
          error?.message ||
            t("home.loadError")
        );
      } finally {
        setLoading(false);
      }
    }

    loadHome();
  }, [
    authLoading,
    user,
  ]);

  const homeState =
    getHomeState(logs);

  const movementAverage =
    useMemo(
      () =>
        getMovementAverage(
          logs
        ),
      [logs]
    );

  return (
    <>
      <section className="home-overview-compact">
        <div className="home-metrics-compact">
          <div className="home-metric home-metric-rhythm">
            <p className="label">{t("home.practiceRhythm")}</p>
            <div className="home-rhythm-lines home-rhythm-list">
              <p>
                <span>{t("home.making")}</span>
                <span aria-hidden="true">—</span>
                <strong>{homeState.making.toFixed(1)}h</strong>
              </p>
              <p>
                <span>{t("home.learning")}</span>
                <span aria-hidden="true">—</span>
                <strong>{homeState.learning.toFixed(1)}h</strong>
              </p>
              <p>
                <span>{t("home.bodyMoving")}</span>
                <span aria-hidden="true">—</span>
                <strong>{movementAverage.toFixed(1)}h</strong>
              </p>
              <p className="home-rhythm-average">{t("home.dailyAverageThisMonth")}</p>
            </div>
          </div>

          <div className="home-metric">
            <p className="label">{t("home.bodyWeather")}</p>
            <div className="home-metric-value home-metric-word">
              {t(`values.${toValueKey(homeState.bodyWeather)}`) !== `values.${toValueKey(homeState.bodyWeather)}`
                ? t(`values.${toValueKey(homeState.bodyWeather)}`)
                : homeState.bodyWeather}
            </div>
            <p className="home-metric-note">{t("home.thisWeek")}</p>
          </div>

          <div className="home-metric">
            <p className="label">{t("home.energyTone")}</p>
            <div className="home-metric-value home-metric-word">
              {t(`values.${toValueKey(homeState.energyTone)}`) !== `values.${toValueKey(homeState.energyTone)}`
                ? t(`values.${toValueKey(homeState.energyTone)}`)
                : homeState.energyTone}
            </div>
            <p className="home-metric-note">{t("home.thisWeek")}</p>
          </div>

          <div className="home-metric">
            <p className="label">{t("home.currentMode")}</p>
            <div className="home-metric-value home-metric-word">
              {t(`values.${toValueKey(homeState.mode)}`) !== `values.${toValueKey(homeState.mode)}`
                ? t(`values.${toValueKey(homeState.mode)}`)
                : homeState.mode}
            </div>
          </div>
        </div>

        <section className="home-suggestion-compact">
          <div className="home-suggestion-heading">
            <span className="eyebrow">{t("home.today")}</span>
            <span className="home-suggestion-title">{t("home.softSuggestion")}</span>
          </div>

          {loading && <p className="home-suggestion-text muted">{t("home.loadingSuggestion")}</p>}

          {!loading && errorMessage && (
            <p className="home-suggestion-text muted">{errorMessage}</p>
          )}

          {!loading && !errorMessage && guidance && (
            <div className="home-suggestion-copy">
              {guidance.state && (
                <p className="home-suggestion-state">
                  <TranslateButton
                    text={guidance.state}
                    sourceLanguage="en"
                    contentKey={`guidance:${guidance.guidance_date || guidance.generated_at || "latest"}:state`}
                    className="translate-block"
                    as="span"
                    showControls={false}
                  />
                </p>
              )}

              <p className="home-suggestion-text">
                <TranslateButton
                  text={guidance.suggested_gesture || guidance.reading || ""}
                  sourceLanguage="en"
                  contentKey={`guidance:${guidance.guidance_date || guidance.generated_at || "latest"}:primary`}
                  className="translate-block"
                  as="span"
                  showControls={false}
                />
              </p>
            </div>
          )}

          {!loading && !errorMessage && !guidance && (
            <p className="home-suggestion-text muted">{t("home.noSuggestion")}</p>
          )}
        </section>
      </section>


      <section className="panel home-archive-first">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              {t("home.input")}
            </p>

            <h2>
              {t("home.latestArchive")}
            </h2>
          </div>

          <a href="/archive">
            {t("home.viewAll")}
          </a>
        </div>

        {archiveEntries.length >
          0 && (
          <div className="archive-grid">
            {archiveEntries.map(
              (entry) => (
                <ArchiveCard
                  key={
                    entry.id
                  }
                  entry={
                    entry
                  }
                  requestAccessToken={
                    getAccessToken
                  }
                />
              )
            )}
          </div>
        )}

        {!archiveEntries.length &&
          !loading && (
            <p className="muted">
              {t("home.noArchiveEntries")}
            </p>
          )}
      </section>


      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              {t("home.input")}
            </p>

            <h2>
              {t("home.latestDaily")}
            </h2>
          </div>

          <a href="/daily">
            {t("home.viewAll")}
          </a>
        </div>

        {logs
          .slice(0, 1)
          .map(
            (log) => (
              <EntryCard
                key={
                  log.id
                }
                log={
                  log
                }
              />
            )
          )}

        {!logs.length &&
          !loading && (
            <p className="muted">
              {t("home.noDailyRecords")}
            </p>
          )}
      </section>
    </>
  );
}
