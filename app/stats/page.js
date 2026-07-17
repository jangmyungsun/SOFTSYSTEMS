"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "../../lib/supabaseClient";

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

export default function StatsPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function init() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession || null);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadStats() {
      if (!session?.access_token) {
        setLoading(false);
        setStats(null);
        return;
      }

      setLoading(true);
      setError("");

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
          setError(payload?.error || "Failed to load analytics dashboard.");
          setStats(null);
          return;
        }

        setStats(payload);
      } catch (nextError) {
        setError(nextError?.message || "Failed to load analytics dashboard.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [session?.access_token]);

  const trafficSources = useMemo(() => stats?.metrics?.trafficSources || [], [stats]);
  const topPages = useMemo(() => stats?.metrics?.topPages || [], [stats]);
  const countries = useMemo(() => stats?.metrics?.countries || [], [stats]);

  if (!session?.user) {
    return (
      <section className="panel">
        <p className="label">Private Analytics</p>
        <h2>Sign in required</h2>
        <p className="muted">This dashboard is private and only visible to the authenticated owner.</p>
      </section>
    );
  }

  return (
    <section className="grid two">
      <div className="panel">
        <p className="label">TODAY</p>
        <h2>Today's visitors</h2>
        <div className="big">
          {loading ? "..." : stats?.metrics?.todayUniqueVisitors ?? 0}
        </div>
        <p className="muted">Timezone: America/New_York</p>
      </div>

      <div className="panel">
        <p className="label">ALL TIME</p>
        <h2>Total visitors</h2>
        <div className="big">
          {loading ? "..." : stats?.metrics?.totalUniqueVisitors ?? 0}
        </div>
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
          {loading ? "..." : Number(stats?.metrics?.averagePagesPerVisitor || 0).toFixed(1)}
        </div>

        <h2 style={{ marginTop: "1.25rem" }}>Average session duration</h2>
        <div className="big">
          {loading
            ? "..."
            : formatDuration(stats?.metrics?.averageSessionDurationSeconds || 0)}
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

      <div className="panel">
        <p className="label">NOTES</p>
        <h2>Collection notes</h2>
        <p className="muted">
          Metrics marked with session/source/country data begin collecting after this deployment.
        </p>
        <p className="muted">
          Started: {stats?.collectingSince ? new Date(stats.collectingSince).toLocaleString() : "pending first session"}
        </p>
        <p className="muted">Commit: {stats?.deployedCommit || "unknown"}</p>
      </div>

      {error ? (
        <div className="panel">
          <p className="label">ERROR</p>
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  );
}
