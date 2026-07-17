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
  const [ownerAccessLoading, setOwnerAccessLoading] = useState(true);
  const [ownerAuthorized, setOwnerAuthorized] = useState(false);
  const [ownerDeviceExcluded, setOwnerDeviceExcluded] = useState(false);
  const [ownerAuthenticatedDetected, setOwnerAuthenticatedDetected] = useState(false);
  const [ownerCookieDetectedServerSide, setOwnerCookieDetectedServerSide] = useState(false);
  const [ownerDeviceHost, setOwnerDeviceHost] = useState("");
  const [ownerExpectedApiResponse, setOwnerExpectedApiResponse] = useState(null);
  const [ownerCookieSettings, setOwnerCookieSettings] = useState(null);
  const [ownerDeviceActioning, setOwnerDeviceActioning] = useState(false);
  const [ownerDeviceMessage, setOwnerDeviceMessage] = useState("");
  const [ownerDeviceTestLoading, setOwnerDeviceTestLoading] = useState(false);
  const [ownerDeviceTestResponse, setOwnerDeviceTestResponse] = useState("");
  const [ownerDiagnosticsLoading, setOwnerDiagnosticsLoading] = useState(false);
  const [ownerBrowserVisitorId, setOwnerBrowserVisitorId] = useState("");
  const [ownerVisitorExistsInSiteVisitors, setOwnerVisitorExistsInSiteVisitors] = useState(false);
  const [ownerVisitorLastSeenAt, setOwnerVisitorLastSeenAt] = useState(null);
  const [ownerTestIgnoredValue, setOwnerTestIgnoredValue] = useState("");
  const [ownerLastSeenChangedAfterTest, setOwnerLastSeenChangedAfterTest] = useState(null);

  async function loadOwnerVisitorDiagnostics(accessToken) {
    if (!accessToken) {
      return null;
    }

    const response = await fetch("/api/visitors/owner-device/diagnostics", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error || "Failed to load owner diagnostics.");
    }

    return payload;
  }

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
    async function loadOwnerControls() {
      if (!session?.access_token) {
        setOwnerAccessLoading(false);
        setOwnerAuthorized(false);
        setOwnerDeviceExcluded(false);
        setOwnerAuthenticatedDetected(false);
        setOwnerCookieDetectedServerSide(false);
        setOwnerDeviceHost("");
        setOwnerExpectedApiResponse(null);
        setOwnerCookieSettings(null);
        setOwnerBrowserVisitorId("");
        setOwnerVisitorExistsInSiteVisitors(false);
        setOwnerVisitorLastSeenAt(null);
        setOwnerTestIgnoredValue("");
        setOwnerLastSeenChangedAfterTest(null);
        return;
      }

      setOwnerAccessLoading(true);

      try {
        const accessResponse = await fetch("/api/system/generate", {
          method: "GET",
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const accessPayload = await accessResponse.json().catch(() => ({}));
        const owner = Boolean(accessResponse.ok && accessPayload?.owner);

        setOwnerAuthorized(owner);

        if (!owner) {
          setOwnerDeviceExcluded(false);
          setOwnerAuthenticatedDetected(false);
          setOwnerCookieDetectedServerSide(false);
          setOwnerDeviceHost("");
          setOwnerExpectedApiResponse(null);
          setOwnerCookieSettings(null);
          setOwnerBrowserVisitorId("");
          setOwnerVisitorExistsInSiteVisitors(false);
          setOwnerVisitorLastSeenAt(null);
          setOwnerTestIgnoredValue("");
          setOwnerLastSeenChangedAfterTest(null);
          return;
        }

        const statusResponse = await fetch("/api/visitors/owner-device/status", {
          method: "GET",
          credentials: "same-origin",
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const statusPayload = await statusResponse.json().catch(() => ({}));
        setOwnerDeviceExcluded(Boolean(statusResponse.ok && statusPayload?.excluded));
        setOwnerAuthenticatedDetected(Boolean(statusResponse.ok && statusPayload?.authenticatedOwnerDetected));
        setOwnerCookieDetectedServerSide(Boolean(statusResponse.ok && statusPayload?.cookieDetectedServerSide));
        setOwnerDeviceHost(String(statusPayload?.host || ""));
        setOwnerExpectedApiResponse(statusResponse.ok ? statusPayload?.expectedAnalyticsApiResponse || null : null);

        const ownerCookieResponse = await fetch("/api/visitors/owner-device", {
          method: "GET",
          credentials: "same-origin",
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const ownerCookiePayload = await ownerCookieResponse.json().catch(() => ({}));
        setOwnerCookieSettings(ownerCookieResponse.ok ? ownerCookiePayload?.cookieSettings || null : null);

        const diagnosticsPayload = await loadOwnerVisitorDiagnostics(session.access_token);
        setOwnerBrowserVisitorId(String(diagnosticsPayload?.visitorId || ""));
        setOwnerVisitorExistsInSiteVisitors(Boolean(diagnosticsPayload?.visitorExistsInSiteVisitors));
        setOwnerVisitorLastSeenAt(diagnosticsPayload?.lastSeenAt || null);
      } catch {
        setOwnerAuthorized(false);
        setOwnerDeviceExcluded(false);
        setOwnerAuthenticatedDetected(false);
        setOwnerCookieDetectedServerSide(false);
        setOwnerDeviceHost("");
        setOwnerExpectedApiResponse(null);
        setOwnerCookieSettings(null);
        setOwnerBrowserVisitorId("");
        setOwnerVisitorExistsInSiteVisitors(false);
        setOwnerVisitorLastSeenAt(null);
      } finally {
        setOwnerAccessLoading(false);
      }
    }

    loadOwnerControls();
  }, [session?.access_token]);

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

  async function handleExcludeDevice() {
    if (!session?.access_token || ownerDeviceActioning) {
      return;
    }

    setOwnerDeviceActioning(true);
    setOwnerDeviceMessage("");

    try {
      const response = await fetch("/api/visitors/owner-device", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setOwnerDeviceMessage(payload?.error || "Failed to exclude this device.");
        return;
      }

      setOwnerDeviceExcluded(true);
      setOwnerCookieDetectedServerSide(true);
      setOwnerDeviceHost(String(payload?.host || ownerDeviceHost));
      setOwnerExpectedApiResponse({ ok: true, ignored: "owner" });
      window.localStorage.setItem("softsystems_owner_device_hint", "1");
      setOwnerDeviceMessage("This device is now excluded from analytics.");

      const diagnosticsPayload = await loadOwnerVisitorDiagnostics(session.access_token);
      setOwnerBrowserVisitorId(String(diagnosticsPayload?.visitorId || ""));
      setOwnerVisitorExistsInSiteVisitors(Boolean(diagnosticsPayload?.visitorExistsInSiteVisitors));
      setOwnerVisitorLastSeenAt(diagnosticsPayload?.lastSeenAt || null);
    } catch (error) {
      setOwnerDeviceMessage(error?.message || "Failed to exclude this device.");
    } finally {
      setOwnerDeviceActioning(false);
    }
  }

  async function handleIncludeDevice() {
    if (!session?.access_token || ownerDeviceActioning) {
      return;
    }

    setOwnerDeviceActioning(true);
    setOwnerDeviceMessage("");

    try {
      const response = await fetch("/api/visitors/owner-device", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setOwnerDeviceMessage(payload?.error || "Failed to include this device again.");
        return;
      }

      setOwnerDeviceExcluded(false);
      setOwnerCookieDetectedServerSide(false);
      setOwnerDeviceHost(String(payload?.host || ownerDeviceHost));
      setOwnerExpectedApiResponse(ownerAuthenticatedDetected ? { ok: true, ignored: "owner" } : { ok: true, ignored: "none" });
      window.localStorage.removeItem("softsystems_owner_device_hint");
      setOwnerDeviceMessage("This device will be included in analytics again.");

      const diagnosticsPayload = await loadOwnerVisitorDiagnostics(session.access_token);
      setOwnerBrowserVisitorId(String(diagnosticsPayload?.visitorId || ""));
      setOwnerVisitorExistsInSiteVisitors(Boolean(diagnosticsPayload?.visitorExistsInSiteVisitors));
      setOwnerVisitorLastSeenAt(diagnosticsPayload?.lastSeenAt || null);
    } catch (error) {
      setOwnerDeviceMessage(error?.message || "Failed to include this device again.");
    } finally {
      setOwnerDeviceActioning(false);
    }
  }

  async function handleCleanupDeviceAnalytics() {
    if (!session?.access_token || ownerDeviceActioning) {
      return;
    }

    const confirmed = window.confirm(
      "Remove this device's previous analytics only? This deletes this browser's matching visitor, page-view, and session rows."
    );

    if (!confirmed) {
      return;
    }

    setOwnerDeviceActioning(true);
    setOwnerDeviceMessage("");

    try {
      const response = await fetch("/api/visitors/owner-device/cleanup", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ confirm: true }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setOwnerDeviceMessage(payload?.error || "Failed to clean up this device's analytics.");
        return;
      }

      setOwnerDeviceMessage(
        `Cleanup complete. Deleted page views: ${payload?.deletedPageViews ?? 0}, sessions: ${payload?.deletedSessions ?? 0}, visitors: ${payload?.deletedVisitors ?? 0}.`
      );

      const diagnosticsPayload = await loadOwnerVisitorDiagnostics(session.access_token);
      setOwnerBrowserVisitorId(String(diagnosticsPayload?.visitorId || ""));
      setOwnerVisitorExistsInSiteVisitors(Boolean(diagnosticsPayload?.visitorExistsInSiteVisitors));
      setOwnerVisitorLastSeenAt(diagnosticsPayload?.lastSeenAt || null);
    } catch (error) {
      setOwnerDeviceMessage(error?.message || "Failed to clean up this device's analytics.");
    } finally {
      setOwnerDeviceActioning(false);
    }
  }

  async function handleTestOwnerExclusion() {
    if (!ownerAuthorized || ownerDeviceTestLoading || !session?.access_token) {
      return;
    }

    setOwnerDeviceTestLoading(true);
    setOwnerDiagnosticsLoading(true);
    setOwnerDeviceTestResponse("");
    setOwnerTestIgnoredValue("");
    setOwnerLastSeenChangedAfterTest(null);

    try {
      const beforeDiagnostics = await loadOwnerVisitorDiagnostics(session.access_token);
      const beforeLastSeenAt = beforeDiagnostics?.lastSeenAt || null;

      const visitorId = window.localStorage.getItem("visitor_id") || "owner-device-test";

      const response = await fetch("/api/visitors", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          visitorId,
          path: "/stats",
          eventType: "activity",
          source: "direct",
          sessionId: "owner-device-test-session",
        }),
      });

      const text = await response.text().catch(() => "");
      setOwnerDeviceTestResponse(text || "{}");

      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }

      setOwnerTestIgnoredValue(String(parsed?.ignored || ""));

      const afterDiagnostics = await loadOwnerVisitorDiagnostics(session.access_token);
      const afterLastSeenAt = afterDiagnostics?.lastSeenAt || null;

      setOwnerBrowserVisitorId(String(afterDiagnostics?.visitorId || beforeDiagnostics?.visitorId || ""));
      setOwnerVisitorExistsInSiteVisitors(Boolean(afterDiagnostics?.visitorExistsInSiteVisitors));
      setOwnerVisitorLastSeenAt(afterLastSeenAt);
      setOwnerLastSeenChangedAfterTest(beforeLastSeenAt !== afterLastSeenAt);
    } catch (error) {
      setOwnerDeviceTestResponse(JSON.stringify({ error: error?.message || "Failed to run test." }));
    } finally {
      setOwnerDiagnosticsLoading(false);
      setOwnerDeviceTestLoading(false);
    }
  }

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

        {ownerAccessLoading ? (
          <p className="muted">Loading owner device controls...</p>
        ) : ownerAuthorized ? (
          <>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
              <button type="button" onClick={handleExcludeDevice} disabled={ownerDeviceActioning || ownerDeviceExcluded}>
                Exclude this device from analytics
              </button>
              <button type="button" onClick={handleIncludeDevice} disabled={ownerDeviceActioning || !ownerDeviceExcluded}>
                Include this device in analytics again
              </button>
              <button type="button" onClick={handleCleanupDeviceAnalytics} disabled={ownerDeviceActioning}>
                Delete this device's historical analytics
              </button>
              <button type="button" onClick={handleTestOwnerExclusion} disabled={ownerDeviceActioning || ownerDeviceTestLoading}>
                Test owner exclusion
              </button>
            </div>
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              Device exclusion status: {ownerDeviceExcluded ? "excluded" : "included"}
            </p>
            <p className="muted">Owner device exclusion: {ownerDeviceExcluded ? "ON" : "OFF"}</p>
            <p className="muted">Authenticated owner detected: {ownerAuthenticatedDetected ? "true" : "false"}</p>
            <p className="muted">Cookie detected server-side: {ownerCookieDetectedServerSide ? "true" : "false"}</p>
            <p className="muted">Expected analytics API response: {ownerExpectedApiResponse ? JSON.stringify(ownerExpectedApiResponse) : "pending"}</p>
            <p className="muted">Owner-device API host: {ownerDeviceHost || "unknown"}</p>
            <p className="muted">Current browser visitor_id: {ownerBrowserVisitorId || "missing visitor_id cookie"}</p>
            <p className="muted">visitor_id exists in site_visitors: {ownerVisitorExistsInSiteVisitors ? "true" : "false"}</p>
            <p className="muted">Current last_seen_at: {ownerVisitorLastSeenAt ? new Date(ownerVisitorLastSeenAt).toLocaleString() : "null"}</p>
            <p className="muted">POST /api/visitors ignored value: {ownerTestIgnoredValue || "pending test"}</p>
            <p className="muted">last_seen_at changed after test: {ownerLastSeenChangedAfterTest === null ? "pending test" : ownerLastSeenChangedAfterTest ? "true" : "false"}</p>
            {ownerDiagnosticsLoading ? <p className="muted">Refreshing diagnostics...</p> : null}
            {ownerCookieSettings ? (
              <p className="muted">
                Cookie settings: {ownerCookieSettings.name}={ownerCookieSettings.value}; Path={ownerCookieSettings.path}; HttpOnly={String(ownerCookieSettings.httpOnly)}; SameSite={ownerCookieSettings.sameSite}; Secure in production={String(ownerCookieSettings.secureInProduction)}; Max-Age={ownerCookieSettings.maxAge}
              </p>
            ) : null}
            {ownerDeviceMessage ? <p className="muted">{ownerDeviceMessage}</p> : null}
            {ownerDeviceTestResponse ? <pre className="muted" style={{ whiteSpace: "pre-wrap" }}>{ownerDeviceTestResponse}</pre> : null}
          </>
        ) : null}
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
                : analytics.sessionDurationUnavailable
                  ? "Not collected yet"
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
        <p className="muted">site_visitors rows: {visitorLoading ? "..." : visitorError ? "—" : verification.siteVisitorsCount ?? "—"}</p>
        <p className="muted">site_page_views rows: {visitorLoading ? "..." : visitorError ? "—" : verification.sitePageViewsCount ?? "—"}</p>
        <p className="muted">distinct visitor_id in site_page_views: {visitorLoading ? "..." : visitorError ? "—" : verification.sitePageViewsDistinctVisitorIdCount ?? "—"}</p>
        <p className="muted">site_visitors not represented in page views: {visitorLoading ? "..." : visitorError ? "—" : verification.siteVisitorsWithoutPageViews ?? "—"}</p>
        <p className="muted">page-view visitor_ids not represented in site_visitors: {visitorLoading ? "..." : visitorError ? "—" : verification.pageViewVisitorsNotInSiteVisitors ?? "—"}</p>
        <p className="muted">today visitors by page views: {visitorLoading ? "..." : visitorError ? "—" : verification.todayPageViewVisitorCount ?? "—"}</p>
        <p className="muted">today visitors by last_seen_at: {visitorLoading ? "..." : visitorError ? "—" : verification.todayLastSeenVisitorCount ?? "—"}</p>
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
