import { NextResponse } from "next/server";

import {
  supabaseAdmin,
  supabaseAdminEnvInfo,
} from "../../../lib/supabaseAdmin";

function logVisitorsError(stage, error, context = {}) {
  console.error("[api/visitors]", stage, {
    message: error?.message || String(error),
    ...context,
  });
}

function getProjectHostname(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "invalid-url";
  }
}

function serializeSupabaseError(error) {
  if (!error) {
    return null;
  }

  return {
    code: error.code ?? null,
    message: error.message ?? String(error),
    details: error.details ?? null,
    hint: error.hint ?? null,
  };
}

function logStep({ projectHostname, pathname, operation, error }) {
  const serializedError = serializeSupabaseError(error);
  console.log("[api/visitors]", {
    projectHostname,
    pathname,
    operation,
    code: serializedError?.code ?? null,
    message: serializedError?.message ?? "ok",
  });
}

function logDbStep({ projectHostname, pathname, operation, phase, data, error }) {
  console.log("[api/visitors][db]", {
    projectHostname,
    pathname,
    operation,
    phase,
    data: data ?? null,
    error: serializeSupabaseError(error),
  });
}

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

function getVisitorId(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/visitor_id=([^;]+)/);

  if (match) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

function hasOwnerDeviceCookie(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return /(?:^|;\s*)softsystems_owner_device=1(?:;|$)/.test(cookieHeader);
}

async function getRequestBody(request) {
  try {
    return await request.json();
  } catch {
    try {
      const text = await request.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }
}

function getPagePath(value) {
  if (typeof value !== "string") {
    return "/";
  }

  const clean = value.trim();

  if (!clean) {
    return "/";
  }

  return clean.startsWith("/") ? clean : "/";
}

function isValidVisitorId(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseSessionId(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeSource(value) {
  const raw = String(value || "").trim().toLowerCase();

  if (!raw) {
    return "direct";
  }

  if (raw.includes("instagram") || raw === "ig") {
    return "instagram";
  }

  if (raw.includes("threads")) {
    return "threads";
  }

  if (raw.includes("google")) {
    return "google";
  }

  if (raw.includes("kakao")) {
    return "kakaotalk";
  }

  if (raw === "direct") {
    return "direct";
  }

  return "other";
}

function getCountryCode(request) {
  const raw = String(request.headers.get("x-vercel-ip-country") || "").trim().toUpperCase();

  if (/^[A-Z]{2}$/.test(raw)) {
    return raw;
  }

  return null;
}

function parseEventType(value) {
  return value === "activity" ? "activity" : "page_view";
}

function isSessionExpired(lastActivityAt, nowMs) {
  const last = Date.parse(String(lastActivityAt || ""));

  if (!Number.isFinite(last)) {
    return true;
  }

  return nowMs - last > 30 * 60 * 1000;
}

export async function POST(request) {
  if (hasOwnerDeviceCookie(request)) {
    return NextResponse.json({ ok: true, ignored: "owner_device", deployedCommit });
  }

  const body = await getRequestBody(request);
  const visitorId = body?.visitorId || getVisitorId(request);
  const pagePath = getPagePath(body?.path);
  const eventType = parseEventType(body?.eventType);
  const sourceCategory = normalizeSource(body?.source);
  const countryCode = getCountryCode(request);
  const projectHostname = getProjectHostname(supabaseAdminEnvInfo.supabaseUrl);
  const diagnostics = {
    deployedCommit,
    projectHostname,
    pathname: pagePath,
    eventType,
    sourceCategory,
    countryCode,
    serviceKeySource: supabaseAdminEnvInfo.serviceKeySource,
    steps: [],
  };

  function pushStep(operation, result, phase = "after") {
    diagnostics.steps.push({
      operation,
      phase,
      data: result?.data ?? null,
      error: serializeSupabaseError(result?.error),
    });
  }

  function failWithDiagnostics(operation, result, status = 500) {
    const serializedError = serializeSupabaseError(result?.error);
    diagnostics.stoppedAt = operation;

    return NextResponse.json(
      {
        error: serializedError?.message || "Unknown Supabase error",
        supabaseError: serializedError,
        deployedCommit,
        diagnostics,
      },
      { status }
    );
  }

  if (!isValidVisitorId(visitorId)) {
    return NextResponse.json({ error: "Invalid visitor id." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const nowMs = Date.parse(nowIso);

  const accessToken = getAuthToken(request);

  if (accessToken) {
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!userError && user) {
      return NextResponse.json({
        counted: false,
        owner: true,
        deployedCommit,
        diagnostics,
      });
    }
  }

  logDbStep({
    projectHostname,
    pathname: pagePath,
    operation: "visitor_lookup",
    phase: "before",
    data: { visitorId },
    error: null,
  });

  const visitorLookupResult = await supabaseAdmin
    .from("site_visitors")
    .select("visitor_id")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  pushStep("visitor_lookup", visitorLookupResult, "after");

  logDbStep({
    projectHostname,
    pathname: pagePath,
    operation: "visitor_lookup",
    phase: "after",
    data: visitorLookupResult.data,
    error: visitorLookupResult.error,
  });

  logStep({
    projectHostname,
    pathname: pagePath,
    operation: "visitor_lookup",
    error: visitorLookupResult.error,
  });

  const existing = visitorLookupResult.data;
  const lookupError = visitorLookupResult.error;

  if (lookupError) {
    logVisitorsError("lookup visitor", lookupError, {
      visitorId,
      pagePath,
      deployedCommit,
    });
    return failWithDiagnostics("visitor_lookup", visitorLookupResult);
  }

  let counted = false;

  if (existing) {
    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "visitor_update",
      phase: "before",
      data: { visitorId: existing.visitor_id },
      error: null,
    });

    const visitorUpdateResult = await supabaseAdmin
      .from("site_visitors")
      .update({ last_seen_at: nowIso })
      .eq("visitor_id", existing.visitor_id)
      .select("visitor_id,last_seen_at");

    pushStep("visitor_update", visitorUpdateResult, "after");

    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "visitor_update",
      phase: "after",
      data: visitorUpdateResult.data,
      error: visitorUpdateResult.error,
    });

    logStep({
      projectHostname,
      pathname: pagePath,
      operation: "visitor_update",
      error: visitorUpdateResult.error,
    });

    const updateError = visitorUpdateResult.error;

    if (updateError) {
      logVisitorsError("update visitor", updateError, {
        visitorId,
        pagePath,
        existingVisitorId: existing.visitor_id,
        deployedCommit,
      });
      return failWithDiagnostics("visitor_update", visitorUpdateResult);
    }
  } else {
    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "visitor_insert",
      phase: "before",
      data: {
        visitor_id: visitorId,
        first_page: pagePath,
      },
      error: null,
    });

    const visitorInsertResult = await supabaseAdmin.from("site_visitors").insert({
      visitor_id: visitorId,
      first_page: pagePath,
      first_seen_at: nowIso,
      last_seen_at: nowIso,
    }).select("visitor_id,first_page,first_seen_at,last_seen_at");

    pushStep("visitor_insert", visitorInsertResult, "after");

    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "visitor_insert",
      phase: "after",
      data: visitorInsertResult.data,
      error: visitorInsertResult.error,
    });

    logStep({
      projectHostname,
      pathname: pagePath,
      operation: "visitor_insert",
      error: visitorInsertResult.error,
    });

    const error = visitorInsertResult.error;

    if (error) {
      logVisitorsError("insert visitor", error, {
        visitorId,
        pagePath,
        deployedCommit,
      });
      return failWithDiagnostics("visitor_insert", visitorInsertResult);
    }

    counted = true;
  }

  let sessionId = parseSessionId(body?.sessionId) || createSessionId();

  logDbStep({
    projectHostname,
    pathname: pagePath,
    operation: "session_lookup",
    phase: "before",
    data: { visitorId, sessionId },
    error: null,
  });

  const sessionLookupResult = await supabaseAdmin
    .from("site_visitor_sessions")
    .select("session_id,session_started_at,last_activity_at,source_category,country_code")
    .eq("visitor_id", visitorId)
    .eq("session_id", sessionId)
    .maybeSingle();

  pushStep("session_lookup", sessionLookupResult, "after");

  logDbStep({
    projectHostname,
    pathname: pagePath,
    operation: "session_lookup",
    phase: "after",
    data: sessionLookupResult.data,
    error: sessionLookupResult.error,
  });

  if (sessionLookupResult.error) {
    logVisitorsError("lookup session", sessionLookupResult.error, {
      visitorId,
      sessionId,
      pagePath,
      deployedCommit,
    });
    return failWithDiagnostics("session_lookup", sessionLookupResult);
  }

  const existingSession = sessionLookupResult.data;
  const sessionExpired = existingSession
    ? isSessionExpired(existingSession.last_activity_at, nowMs)
    : false;

  if (sessionExpired) {
    sessionId = createSessionId();
  }

  if (existingSession && !sessionExpired) {
    const sessionUpdatePayload = {
      last_activity_at: nowIso,
    };

    if (!existingSession.source_category) {
      sessionUpdatePayload.source_category = sourceCategory;
    }

    if (!existingSession.country_code && countryCode) {
      sessionUpdatePayload.country_code = countryCode;
    }

    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "session_update",
      phase: "before",
      data: { visitorId, sessionId, sessionUpdatePayload },
      error: null,
    });

    const sessionUpdateResult = await supabaseAdmin
      .from("site_visitor_sessions")
      .update(sessionUpdatePayload)
      .eq("visitor_id", visitorId)
      .eq("session_id", sessionId)
      .select("session_id,source_category,country_code,session_started_at,last_activity_at");

    pushStep("session_update", sessionUpdateResult, "after");

    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "session_update",
      phase: "after",
      data: sessionUpdateResult.data,
      error: sessionUpdateResult.error,
    });

    if (sessionUpdateResult.error) {
      logVisitorsError("update session", sessionUpdateResult.error, {
        visitorId,
        sessionId,
        pagePath,
        deployedCommit,
      });
      return failWithDiagnostics("session_update", sessionUpdateResult);
    }
  } else {
    const sessionInsertPayload = {
      visitor_id: visitorId,
      session_id: sessionId,
      source_category: sourceCategory,
      country_code: countryCode,
      session_started_at: nowIso,
      last_activity_at: nowIso,
    };

    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "session_insert",
      phase: "before",
      data: sessionInsertPayload,
      error: null,
    });

    const sessionInsertResult = await supabaseAdmin
      .from("site_visitor_sessions")
      .insert(sessionInsertPayload)
      .select("session_id,source_category,country_code,session_started_at,last_activity_at");

    pushStep("session_insert", sessionInsertResult, "after");

    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "session_insert",
      phase: "after",
      data: sessionInsertResult.data,
      error: sessionInsertResult.error,
    });

    if (sessionInsertResult.error) {
      logVisitorsError("insert session", sessionInsertResult.error, {
        visitorId,
        sessionId,
        pagePath,
        deployedCommit,
      });
      return failWithDiagnostics("session_insert", sessionInsertResult);
    }
  }

  const cutoff = new Date(Date.now() - 30 * 1000).toISOString();

  logDbStep({
    projectHostname,
    pathname: pagePath,
    operation: "page_view_lookup",
    phase: "before",
    data: { visitorId, pagePath, cutoff },
    error: null,
  });

  const pageViewLookupResult = await supabaseAdmin
    .from("site_page_views")
    .select("id")
    .eq("visitor_id", visitorId)
    .eq("page_path", pagePath)
    .gte("created_at", cutoff)
    .limit(1);

  pushStep("page_view_lookup", pageViewLookupResult, "after");

  logDbStep({
    projectHostname,
    pathname: pagePath,
    operation: "page_view_lookup",
    phase: "after",
    data: pageViewLookupResult.data,
    error: pageViewLookupResult.error,
  });

  logStep({
    projectHostname,
    pathname: pagePath,
    operation: "page_view_lookup",
    error: pageViewLookupResult.error,
  });

  const recentViews = pageViewLookupResult.data;
  const recentViewError = pageViewLookupResult.error;

  if (recentViewError) {
    logVisitorsError("lookup recent page views", recentViewError, {
      visitorId,
      pagePath,
      cutoff,
      deployedCommit,
    });
    return failWithDiagnostics("page_view_lookup", pageViewLookupResult);
  }

  let viewCounted = false;

  if (eventType === "page_view" && (!recentViews || recentViews.length === 0)) {
    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "page_view_insert",
      phase: "before",
      data: {
        visitor_id: visitorId,
        page_path: pagePath,
      },
      error: null,
    });

    const pageViewInsertResult = await supabaseAdmin.from("site_page_views").insert({
      visitor_id: visitorId,
      page_path: pagePath,
    }).select("id,visitor_id,page_path,created_at");

    pushStep("page_view_insert", pageViewInsertResult, "after");

    logDbStep({
      projectHostname,
      pathname: pagePath,
      operation: "page_view_insert",
      phase: "after",
      data: pageViewInsertResult.data,
      error: pageViewInsertResult.error,
    });

    logStep({
      projectHostname,
      pathname: pagePath,
      operation: "page_view_insert",
      error: pageViewInsertResult.error,
    });

    const pageViewError = pageViewInsertResult.error;

    if (pageViewError) {
      logVisitorsError("insert page view", pageViewError, {
        visitorId,
        pagePath,
        deployedCommit,
      });
      return failWithDiagnostics("page_view_insert", pageViewInsertResult);
    }

    viewCounted = true;
  }

  const response = NextResponse.json({
    counted,
    duplicate: !counted,
    viewCounted,
    sessionId,
    sourceCategory,
    countryCode,
    deployedCommit,
    diagnostics,
  });

  response.cookies.set("visitor_id", visitorId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function GET() {
  const { count, error } = await supabaseAdmin
    .from("site_visitors")
    .select("visitor_id", { count: "exact", head: true });

  if (error) {
    logVisitorsError("count visitors", error, { deployedCommit });
    return NextResponse.json({ error: error.message, deployedCommit }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0, deployedCommit });
}
