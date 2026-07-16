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
  const monthLogs =
    logs.filter(
      (log) =>
        isCurrentMonth(
          log.date
        )
    );

  if (!monthLogs.length) {
    return 0;
  }

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
    monthLogs.length
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

function normalizeArchiveEntry(entry) {
  return {
    ...entry,

    tags:
      normalizeTags(
        entry?.tags
      ),

    is_public:
      entry?.is_public !==
      false,
  };
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
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    async function loadHome() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [
          logsResult,
          archiveResult,
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

        if (archiveResult.error) {
          throw archiveResult.error;
        }

        if (guidanceResult.error) {
          throw guidanceResult.error;
        }

        setLogs(
          logsResult.data || []
        );

        setArchiveEntries(
          (
            archiveResult.data ||
            []
          ).map(
            normalizeArchiveEntry
          )
        );

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
  }, []);

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
      <section className="grid four">
        <div className="panel">
          <p className="label">
            {t("home.practiceRhythm")}
          </p>

          <div className="big">
            {homeState.making.toFixed(
              1
            )}
            h
          </div>

          <p className="muted">
            {t("home.making")} {" "}
            {t("home.perDayThisMonth", {
              hours: homeState.making.toFixed(1),
            })}
          </p>

          <p className="muted">
            {t("home.learning")} {" "}
            {t("home.perDayThisMonth", {
              hours: homeState.learning.toFixed(1),
            })}
          </p>

          <p className="muted">
            {t("home.bodyMoving")} {" "}
            {t("home.perDayThisMonth", {
              hours: movementAverage.toFixed(1),
            })}
          </p>
        </div>

        <div className="panel">
          <p className="label">
            {t("home.bodyWeather")}
          </p>

          <div className="big">
            {t(`values.${toValueKey(homeState.bodyWeather)}`) !== `values.${toValueKey(homeState.bodyWeather)}`
              ? t(`values.${toValueKey(homeState.bodyWeather)}`)
              : homeState.bodyWeather}
          </div>

          <p className="muted">
            {t("home.thisWeek")}
          </p>
        </div>

        <div className="panel">
          <p className="label">
            {t("home.energyTone")}
          </p>

          <div className="big">
            {t(`values.${toValueKey(homeState.energyTone)}`) !== `values.${toValueKey(homeState.energyTone)}`
              ? t(`values.${toValueKey(homeState.energyTone)}`)
              : homeState.energyTone}
          </div>

          <p className="muted">
            {t("home.thisWeek")}
          </p>
        </div>

        <div className="panel">
          <p className="label">
            {t("home.currentMode")}
          </p>

          <div className="big">
            {t(`values.${toValueKey(homeState.mode)}`) !== `values.${toValueKey(homeState.mode)}`
              ? t(`values.${toValueKey(homeState.mode)}`)
              : homeState.mode}
          </div>
        </div>
      </section>

      <section className="panel soft-suggestion">
        <p className="eyebrow">
          {t("home.today")}
        </p>

        <h2>
          {t("home.softSuggestion")}
        </h2>

        {loading && (
          <p className="muted">
            {t("home.loadingSuggestion")}
          </p>
        )}

        {!loading &&
          errorMessage && (
            <p className="muted">
              {errorMessage}
            </p>
          )}

        {!loading &&
          !errorMessage &&
          guidance && (
            <>
              {guidance.state && (
                <p className="label">
                  {guidance.state}
                </p>
              )}

              <p className="soft-suggestion-reading">
                {guidance.suggested_gesture ||
                  guidance.reading}
              </p>
            </>
          )}

        {!loading &&
          !errorMessage &&
          !guidance && (
            <p className="muted">
              {t("home.noSuggestion")}
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
