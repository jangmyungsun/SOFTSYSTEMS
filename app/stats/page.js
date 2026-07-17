"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  getHomeState,
  parseWorkHours,
  getLearningHours,
} from "../../lib/utils";
import {
  buildWeeklyRhythmSummary,
  formatDisplayHours,
} from "../../lib/weeklyRhythms";
import { useLanguage } from "../../components/LanguageProvider";

function toValueKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseMovementHours(value) {
  if (!value) return 0;

  const text = String(value).toLowerCase();

  let total = 0;

  const h = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const m = text.match(/(\d+(?:\.\d+)?)\s*m/);

  if (h) total += Number(h[1]);
  if (m) total += Number(m[1]) / 60;

  if (!h && !m) {
    const n = Number(text);
    if (!Number.isNaN(n)) total = n;
  }

  return total;
}

function translateValue(t, value) {
  const key = `values.${toValueKey(value)}`;
  const translated = t(key);

  return translated === key ? value : translated;
}

function formatWeeklyComparison(summary, locale, t) {
  const delta = Math.abs(summary.differenceHours);
  const deltaText = formatDisplayHours(delta, locale);

  if (summary.trend === "same") {
    return t("stats.sameAsLastWeek");
  }

  if (locale === "ko") {
    return summary.trend === "increased"
      ? `지난주보다 ${deltaText} ${t("stats.increased")}`
      : `지난주보다 ${deltaText} ${t("stats.decreased")}`;
  }

  return summary.trend === "increased"
    ? `↑ ${deltaText} ${t("stats.comparedWithLastWeek")}`
    : `↓ ${deltaText} ${t("stats.comparedWithLastWeek")}`;
}

function formatWeeklyModeSummary(summary, t) {
  if (!summary?.value) {
    return t("stats.noRecordsThisWeek");
  }

  const countLabel = summary.count === 1 ? t("stats.record") : t("stats.records");

  return `${t("stats.thisWeek")}: ${translateValue(t, summary.value)} · ${summary.count} ${countLabel}`;
}

function formatDuration(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

function formatPercent(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(1)}%`;
}

function getCountryName(countryCode) {
  if (!countryCode) {
    return "Other";
  }

  try {
    const display = new Intl.DisplayNames(["en"], { type: "region" });
    return display.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

function toDisplayDate(value) {
  if (!value) {
    return "Pending";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function StatisticsPage() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const locale = language?.locale ?? "en";
  const [logs, setLogs] = useState([]);
  const [session, setSession] = useState(null);
  const [visitorLoading, setVisitorLoading] = useState(true);
  const [visitorError, setVisitorError] = useState("");
  const [visitorErrorDetails, setVisitorErrorDetails] = useState(null);
  const [visitorStats, setVisitorStats] = useState(null);

  useEffect(() => {
    supabase
      .from("field_logs")
      .select("*")
      .eq("is_public", true)
      .then(({ data }) => setLogs(data || []));
  }, []);

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession || null);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadVisitorStats() {
      if (!session?.access_token) {
        setVisitorLoading(false);
        setVisitorStats(null);
        setVisitorErrorDetails(null);
        return;
      }

      setVisitorLoading(true);
      setVisitorError("");
      setVisitorErrorDetails(null);

      try {
        const response = await fetch("/api/visitors/stats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setVisitorStats(null);
          setVisitorError(payload?.error || "Failed to load visitor analytics.");
          setVisitorErrorDetails({
            step: payload?.step || null,
            code: payload?.supabaseError?.code || null,
            message: payload?.supabaseError?.message || null,
            hostname: payload?.projectHostname || visitorStats?.verification?.supabaseHostname || null,
          });
          return;
        }

        setVisitorStats(payload);
      } catch (error) {
        setVisitorStats(null);
        setVisitorError(error?.message || "Failed to load visitor analytics.");
        setVisitorErrorDetails({
          step: null,
          code: null,
          message: error?.message || null,
          hostname: null,
        });
      } finally {
        setVisitorLoading(false);
      }
    }

    loadVisitorStats();
  }, [session?.access_token]);

  const h = getHomeState(logs);
  const weekly = useMemo(() => buildWeeklyRhythmSummary(logs), [logs]);

  const making = logs.reduce(
    (sum, log) =>
      sum +
      parseWorkHours(log.work?.time),
    0
  );

  const learning = logs.reduce(
    (sum, log) =>
      sum +
      getLearningHours(log),
    0
  );

  const moving = logs.reduce(
    (sum, log) =>
      sum +
      parseMovementHours(
        log.movement?.time
      ),
    0
  );

  const moods = logs
    .map((l) =>
      Number(l.state?.mood)
    )
    .filter((n) => !Number.isNaN(n));

  const averageMood =
    moods.length
      ? moods.reduce(
          (a, b) => a + b,
          0
        ) / moods.length
      : 0;

  let mindWeather = "Unknown";

  if (averageMood >= 8)
    mindWeather = "Clear";
  else if (averageMood >= 6)
    mindWeather = "Stable";
  else if (averageMood >= 4)
    mindWeather = "Cloudy";
  else if (averageMood > 0)
    mindWeather = "Heavy";

  const analytics = visitorStats?.metrics || {};
  const verification = visitorStats?.verification || {};
  const trafficSources = analytics.trafficSources || [];
  const topPages = analytics.topPages || [];
  const countries = analytics.countries || [];

  if (!session?.user) {
    return (
      <section className="panel">
        <p className="label">Private Analytics</p>
        <h2>Sign in required</h2>
        <p className="muted">This page is private and only visible to the authenticated owner.</p>
      </section>
    );
  }

  return (
    <>
      <section className="grid four">
        <div className="panel">
          <p className="label">
            {t("process.making")}
          </p>

          <div className="big">
            {formatDisplayHours(making, locale)}
          </div>

          <p className="muted">
            {t("stats.hoursThisWeek", { hours: formatDisplayHours(weekly.making.currentHours, locale) })}
          </p>

          <p className="muted">
            {formatWeeklyComparison(weekly.making, locale, t)}
          </p>

          <p className="muted">
            {t("stats.totalPublic")}
          </p>
        </div>

        <div className="panel">
          <p className="label">
            {t("process.learning")}
          </p>

          <div className="big">
            {formatDisplayHours(learning, locale)}
          </div>

          <p className="muted">
            {t("stats.hoursThisWeek", { hours: formatDisplayHours(weekly.learning.currentHours, locale) })}
          </p>

          <p className="muted">
            {formatWeeklyComparison(weekly.learning, locale, t)}
          </p>

          <p className="muted">
            {t("stats.totalPublic")}
          </p>
        </div>

        <div className="panel">
          <p className="label">
            {t("process.moving")}
          </p>

          <div className="big">
            {formatDisplayHours(moving, locale)}
          </div>

          <p className="muted">
            {t("stats.hoursThisWeek", { hours: formatDisplayHours(weekly.moving.currentHours, locale) })}
          </p>

          <p className="muted">
            {formatWeeklyComparison(weekly.moving, locale, t)}
          </p>

          <p className="muted">
            {t("stats.totalPublic")}
          </p>
        </div>

        <div className="panel">
          <p className="label">
            {t("process.bodyWeather")}
          </p>

          <div className="big">
            {translateValue(t, h.bodyWeather)}
          </div>

          <p className="muted">
            {formatWeeklyModeSummary(weekly.bodyWeather, t)}
          </p>
        </div>

        <div className="panel">
          <p className="label">
            {t("process.mindWeather")}
          </p>

          <div className="big">
            {translateValue(t, mindWeather)}
          </div>

          <p className="muted">
            {formatWeeklyModeSummary(weekly.mindWeather, t)}
          </p>
        </div>

        <div className="panel">
          <p className="label">
            {t("process.energyTone")}
          </p>

          <div className="big">
            {translateValue(t, h.energyTone)}
          </div>

          <p className="muted">
            {formatWeeklyModeSummary(weekly.energyTone, t)}
          </p>
        </div>
      </section>

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <p className="label">Visitor Analytics</p>
        <h2>Private visitor dashboard</h2>
        <p className="muted">
          These metrics only include analytics collected after tracking began working.
        </p>
      </section>

      <section className="grid two">
        <div className="panel">
          <p className="label">TODAY</p>
          <h2>Today's visitors</h2>
          <div className="big">
            {visitorLoading ? "..." : visitorError ? "—" : analytics.todayUniqueVisitors}
          </div>
          <p className="muted">Timezone: {visitorStats?.timezone || "America/New_York"}</p>
        </div>

        <div className="panel">
          <p className="label">ALL TIME</p>
          <h2>Total visitors</h2>
          <div className="big">
            {visitorLoading ? "..." : visitorError ? "—" : analytics.totalUniqueVisitors}
          </div>
          <p className="muted">Total page views: {visitorLoading ? "..." : visitorError ? "—" : analytics.totalPageViews}</p>
        </div>

        <div className="panel">
          <p className="label">TOP PAGES</p>
          <h2>Most viewed pages</h2>
          {topPages.length ? (
            <ol>
              {topPages.map((entry, index) => (
                <li key={`${entry.pagePath}-${index}`}>
                  {entry.label} · {entry.views}
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No page-view data yet.</p>
          )}
        </div>

        <div className="panel">
          <p className="label">TRAFFIC SOURCES</p>
          <h2>Source split</h2>
          {trafficSources.length ? (
            <ul>
              {trafficSources.map((entry) => (
                <li key={entry.key}>
                  {entry.label} {formatPercent(entry.percent)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No source data yet.</p>
          )}
        </div>

        <div className="panel">
          <p className="label">ENGAGEMENT</p>
          <h2>Average pages per visitor</h2>
          <div className="big">
            {visitorLoading ? "..." : visitorError ? "—" : Number(analytics.averagePagesPerVisitor).toFixed(1)}
          </div>

          <h2 style={{ marginTop: "1.25rem" }}>Average session duration</h2>
          <div className="big">
            {visitorLoading
              ? "..."
              : visitorError
                ? "—"
                : formatDuration(analytics.averageSessionDurationSeconds)}
          </div>
        </div>

        <div className="panel">
          <p className="label">COUNTRIES</p>
          <h2>Visitor countries</h2>
          {countries.length ? (
            <ul>
              {countries.map((entry) => (
                <li key={entry.countryCode}>
                  {getCountryName(entry.countryCode)} {formatPercent(entry.percent)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No country data yet.</p>
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <p className="label">VERIFICATION</p>
        <h2>Raw Supabase counts</h2>
        <p className="muted">site_visitors rows: {visitorLoading ? "..." : verification.siteVisitorsCount ?? 0}</p>
        <p className="muted">site_page_views rows: {visitorLoading ? "..." : verification.sitePageViewsCount ?? 0}</p>
        <p className="muted">distinct visitor_id in site_page_views: {visitorLoading ? "..." : verification.sitePageViewsDistinctVisitorIdCount ?? 0}</p>
        <p className="muted">site_visitors not represented in page views: {visitorLoading ? "..." : verification.siteVisitorsWithoutPageViews ?? 0}</p>
        <p className="muted">page-view visitor_ids not represented in site_visitors: {visitorLoading ? "..." : verification.pageViewVisitorsNotInSiteVisitors ?? 0}</p>
        <p className="muted">today visitors by page views: {visitorLoading ? "..." : verification.todayPageViewVisitorCount ?? 0}</p>
        <p className="muted">today visitors by last_seen_at: {visitorLoading ? "..." : verification.todayLastSeenVisitorCount ?? 0}</p>
        <p className="muted">earliest site_visitors.first_seen_at: {toDisplayDate(verification.earliestVisitorFirstSeenAt)}</p>
        <p className="muted">latest site_visitors.last_seen_at: {toDisplayDate(verification.latestVisitorLastSeenAt)}</p>
        <p className="muted">today boundary: {visitorStats?.verification?.todayBoundaryStart || "pending"} → {visitorStats?.verification?.todayBoundaryEnd || "pending"}</p>
        <p className="muted">timezone: {verification.timezone || "America/New_York"}</p>
        <p className="muted">Supabase hostname: {verification.supabaseHostname || "unknown"}</p>
      </section>

      {visitorError ? (
        <section className="panel" style={{ marginTop: "1.5rem" }}>
          <p className="label">ERROR</p>
          <p>{visitorError}</p>
          <p className="muted">
            {visitorErrorDetails?.step ? `Step: ${visitorErrorDetails.step}` : "Step: unknown"}
          </p>
          <p className="muted">
            {visitorErrorDetails?.code || visitorErrorDetails?.message
              ? `${visitorErrorDetails?.code || ""}${visitorErrorDetails?.code && visitorErrorDetails?.message ? ": " : ""}${visitorErrorDetails?.message || ""}`
              : "No Supabase error details available."}
          </p>
          <p className="muted">
            Supabase hostname: {visitorErrorDetails?.hostname || verification.supabaseHostname || "unknown"}
          </p>
        </section>
      ) : null}

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <p className="label">NOTES</p>
        <h2>Collection notes</h2>
        <p className="muted">
          Analytics metrics are only counted from visits recorded after tracking became operational.
        </p>
        <p className="muted">
          Started: {visitorStats?.collectingSince ? new Date(visitorStats.collectingSince).toLocaleString() : "pending first session"}
        </p>
        <p className="muted">Commit: {visitorStats?.deployedCommit || "unknown"}</p>
      </section>
    </>
  );
}
