import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIME_ZONE = "America/New_York";
const PAGE_SIZE = 1000;

const deployedCommit =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  "unknown";

function getAuthToken(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.replace(/^Bearer\s+/i, "");
}

function toErrorPayload(error) {
  if (!error) {
    return null;
  }

  return {
    message: error.message || String(error),
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null,
  };
}

function formatDateInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function getOffsetMinutes(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeZoneName = formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value || "GMT";
  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  return sign * (hours * 60 + minutes);
}

function getNewYorkTodayBounds() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }

    return acc;
  }, {});

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const middayThisDay = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  const middayNextDay = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0, 0));
  const startOffsetMinutes = getOffsetMinutes(middayThisDay, TIME_ZONE);
  const endOffsetMinutes = getOffsetMinutes(middayNextDay, TIME_ZONE);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - startOffsetMinutes * 60 * 1000);
  const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) - endOffsetMinutes * 60 * 1000 - 1);

  return {
    todayKey: formatDateInTimeZone(now, TIME_ZONE),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function normalizePagePath(path) {
  if (typeof path !== "string") {
    return "/";
  }

  const clean = path.trim();

  if (!clean) {
    return "/";
  }

  if (clean === "/") {
    return "/";
  }

  if (!clean.startsWith("/")) {
    return "/";
  }

  return clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

function getPageLabel(path) {
  const normalized = normalizePagePath(path);

  if (normalized === "/") {
    return "Home";
  }

  if (normalized === "/input" || normalized === "/daily") {
    return "Input";
  }

  if (normalized === "/process") {
    return "Process";
  }

  if (normalized === "/output") {
    return "Output";
  }

  if (normalized === "/about") {
    return "About";
  }

  if (normalized === "/letters") {
    return "Visitor Letters";
  }

  return normalized;
}

function normalizeSource(source) {
  const raw = String(source || "").trim().toLowerCase();

  if (!raw) {
    return "direct";
  }

  if (raw === "instagram") {
    return "instagram";
  }

  if (raw === "threads") {
    return "threads";
  }

  if (raw === "google") {
    return "google";
  }

  if (raw === "kakaotalk") {
    return "kakaotalk";
  }

  if (raw === "direct") {
    return "direct";
  }

  return "other";
}

function parseIso(value) {
  const date = new Date(String(value || ""));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function fetchAllRows(tableName, columns, filters = []) {
  let from = 0;
  const rows = [];

  while (true) {
    let query = supabaseAdmin
      .from(tableName)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);

    for (const applyFilter of filters) {
      query = applyFilter(query);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const chunk = Array.isArray(data) ? data : [];
    rows.push(...chunk);

    if (chunk.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}

async function fetchCount(tableName, filters = []) {
  let query = supabaseAdmin.from(tableName).select("id", { count: "exact", head: true });

  for (const applyFilter of filters) {
    query = applyFilter(query);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count || 0;
}

function toPercent(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

function toOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

export async function GET(request) {
  const token = getAuthToken(request);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
        supabaseError: toErrorPayload(userError),
      },
      { status: 401 }
    );
  }

  try {
    const [siteVisitorsRows, pageViewsRows, sessions, totalVisitors, totalPageViews] = await Promise.all([
      fetchAllRows("site_visitors", "visitor_id,first_seen_at,last_seen_at,created_at"),
      fetchAllRows("site_page_views", "visitor_id,page_path,created_at"),
      fetchAllRows(
        "site_visitor_sessions",
        "visitor_id,source_category,country_code,session_started_at,last_activity_at,created_at"
      ),
      fetchCount("site_visitors"),
      fetchCount("site_page_views"),
    ]);

    const bounds = getNewYorkTodayBounds();

    const visitorsTodaySet = new Set();
    const pageCounts = new Map();

    for (const view of pageViewsRows) {
      const visitorId = typeof view?.visitor_id === "string" ? view.visitor_id : "";
      const pagePath = normalizePagePath(view?.page_path);
      const createdAt = parseIso(view?.created_at);

      if (visitorId && createdAt && createdAt.toISOString() >= bounds.start && createdAt.toISOString() <= bounds.end) {
        visitorsTodaySet.add(visitorId);
      }

      pageCounts.set(pagePath, (pageCounts.get(pagePath) || 0) + 1);
    }

    const topPages = Array.from(pageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pagePath, views]) => ({
        pagePath,
        label: getPageLabel(pagePath),
        views,
      }));

    const sourceBuckets = {
      instagram: 0,
      threads: 0,
      google: 0,
      kakaotalk: 0,
      direct: 0,
      other: 0,
    };

    const latestCountryByVisitor = new Map();
    let totalDurationSeconds = 0;

    for (const session of sessions) {
      const source = normalizeSource(session?.source_category);
      sourceBuckets[source] += 1;

      const visitorId = typeof session?.visitor_id === "string" ? session.visitor_id : "";
      const countryCode = typeof session?.country_code === "string"
        ? session.country_code.toUpperCase()
        : "";
      const sessionStart = parseIso(session?.session_started_at);
      const lastActivity = parseIso(session?.last_activity_at);
      const now = new Date();

      if (sessionStart && lastActivity) {
        const isActive = now.getTime() - lastActivity.getTime() <= 30 * 60 * 1000;
        const end = isActive ? now : lastActivity;
        const rawDuration = (end.getTime() - sessionStart.getTime()) / 1000;
        const cappedDuration = Math.max(0, Math.min(rawDuration, 30 * 60));
        totalDurationSeconds += cappedDuration;
      }

      if (visitorId && countryCode) {
        const marker = parseIso(session?.last_activity_at) || parseIso(session?.created_at);
        const markerMs = marker ? marker.getTime() : 0;
        const existing = latestCountryByVisitor.get(visitorId);

        if (!existing || markerMs > existing.markerMs) {
          latestCountryByVisitor.set(visitorId, {
            countryCode,
            markerMs,
          });
        }
      }
    }

    const totalSources = Object.values(sourceBuckets).reduce((sum, value) => sum + value, 0);

    const trafficSources = [
      { key: "instagram", label: "Instagram" },
      { key: "threads", label: "Threads" },
      { key: "google", label: "Google" },
      { key: "kakaotalk", label: "KakaoTalk" },
      { key: "direct", label: "Direct" },
      { key: "other", label: "Other" },
    ].map((source) => ({
      ...source,
      count: sourceBuckets[source.key] || 0,
      percent: toPercent(sourceBuckets[source.key] || 0, totalSources),
    }));

    const countryCounts = new Map();
    for (const entry of latestCountryByVisitor.values()) {
      countryCounts.set(entry.countryCode, (countryCounts.get(entry.countryCode) || 0) + 1);
    }

    const totalCountryVisitors = Array.from(countryCounts.values()).reduce((sum, value) => sum + value, 0);
    const countries = Array.from(countryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([countryCode, visitors]) => ({
        countryCode,
        visitors,
        percent: toPercent(visitors, totalCountryVisitors),
      }));

    const distinctPageViewVisitors = new Set(
      pageViewsRows
        .map((row) => (typeof row?.visitor_id === "string" ? row.visitor_id : ""))
        .filter(Boolean)
    ).size;

    const siteVisitorIds = new Set(
      siteVisitorsRows
        .map((row) => (typeof row?.visitor_id === "string" ? row.visitor_id : ""))
        .filter(Boolean)
    );

    const pageViewVisitorIds = new Set(
      pageViewsRows
        .map((row) => (typeof row?.visitor_id === "string" ? row.visitor_id : ""))
        .filter(Boolean)
    );

    const siteVisitorsWithoutPageViews = Array.from(siteVisitorIds).filter(
      (visitorId) => !pageViewVisitorIds.has(visitorId)
    ).length;

    const pageViewVisitorsNotInSiteVisitors = Array.from(pageViewVisitorIds).filter(
      (visitorId) => !siteVisitorIds.has(visitorId)
    ).length;

    const earliestVisitor = siteVisitorsRows
      .map((row) => parseIso(row?.first_seen_at) || parseIso(row?.created_at))
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime())[0] || null;

    const latestVisitor = siteVisitorsRows
      .map((row) => parseIso(row?.last_seen_at) || parseIso(row?.created_at))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    const averagePagesPerVisitor = totalVisitors
      ? toOneDecimal((totalPageViews || 0) / totalVisitors)
      : 0;

    const averageSessionDurationSeconds = sessions.length
      ? Math.round(totalDurationSeconds / sessions.length)
      : 0;

    const collectingSince = sessions
      .map((session) => parseIso(session?.created_at) || parseIso(session?.session_started_at))
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return NextResponse.json({
      timezone: TIME_ZONE,
      deployedCommit,
      metrics: {
        todayUniqueVisitors: visitorsTodaySet.size,
        totalUniqueVisitors: totalVisitors || 0,
        totalPageViews: totalPageViews || 0,
        distinctPageViewVisitors,
        topPages,
        trafficSources,
        averagePagesPerVisitor,
        averageSessionDurationSeconds,
        countries,
      },
      verification: {
        siteVisitorsCount: totalVisitors || 0,
        sitePageViewsCount: totalPageViews || 0,
        sitePageViewsDistinctVisitorIdCount: distinctPageViewVisitors,
        siteVisitorsWithoutPageViews,
        pageViewVisitorsNotInSiteVisitors,
        earliestVisitorFirstSeenAt: earliestVisitor ? earliestVisitor.toISOString() : null,
        latestVisitorLastSeenAt: latestVisitor ? latestVisitor.toISOString() : null,
        todayBoundaryStart: bounds.start,
        todayBoundaryEnd: bounds.end,
        timezone: TIME_ZONE,
        supabaseHostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname || null,
      },
      collectingSince: collectingSince ? collectingSince.toISOString() : null,
      notes: {
        sessionBasedMetricsStartAfterDeploy: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load analytics stats.",
        supabaseError: toErrorPayload(error),
      },
      { status: 500 }
    );
  }
}
