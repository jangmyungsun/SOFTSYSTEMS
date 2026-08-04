import { NextResponse } from "next/server";

import {
  supabaseAdmin,
  supabaseAdminEnvInfo,
} from "../../../lib/supabaseAdmin";

function logVisitorsError(stage, error) {
  console.error("[api/visitors]", stage, {
    code: error?.code ?? null,
    message: error?.message || String(error),
  });
}

function sanitizeIp(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const unwrapped = trimmed.startsWith("::ffff:")
    ? trimmed.slice(7)
    : trimmed;

  const ipv4WithPort = unwrapped.match(/^(\d+\.\d+\.\d+\.\d+):(\d+)$/);

  if (ipv4WithPort) {
    return ipv4WithPort[1];
  }

  return unwrapped;
}

function getClientIp(request) {
  const xForwardedFor = String(request.headers.get("x-forwarded-for") || "");

  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0];
    const normalized = sanitizeIp(first);

    if (normalized) {
      return normalized;
    }
  }

  const xRealIp = sanitizeIp(String(request.headers.get("x-real-ip") || ""));

  if (xRealIp) {
    return xRealIp;
  }

  return "";
}

function getConfiguredOwnerIps() {
  const raw = String(process.env.OWNER_IPS || "");

  if (!raw.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => sanitizeIp(value))
    .filter(Boolean);
}

function isConfiguredOwnerIp(request) {
  const clientIp = sanitizeIp(getClientIp(request));

  if (!clientIp) {
    return false;
  }

  const configuredOwnerIps = getConfiguredOwnerIps();
  return configuredOwnerIps.includes(clientIp);
}

function getVisitorIdFromCookie(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)visitor_id=([^;]+)/);

  if (!match) {
    return "";
  }

  try {
    return decodeURIComponent(match[1]).trim();
  } catch {
    return String(match[1] || "").trim();
  }
}

async function getRequestBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function normalizeVisitorId(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidVisitorId(value) {
  return /^[A-Za-z0-9-]{8,128}$/.test(value);
}

async function getPublicVisitorCount(excludedVisitorIds = []) {
  let query = supabaseAdmin
    .from("site_visitors")
    .select("*", {
      count: "exact",
      head: true,
    });

  for (const visitorId of excludedVisitorIds) {
    query = query.neq("visitor_id", visitorId);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function upsertVisitor(visitorId, nowIso) {
  const visitorLookupResult = await supabaseAdmin
    .from("site_visitors")
    .select("visitor_id")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (visitorLookupResult.error) {
    throw visitorLookupResult.error;
  }

  if (visitorLookupResult.data?.visitor_id) {
    const updateResult = await supabaseAdmin
      .from("site_visitors")
      .update({ last_seen_at: nowIso })
      .eq("visitor_id", visitorId);

    if (updateResult.error) {
      throw updateResult.error;
    }

    return;
  }

  const insertResult = await supabaseAdmin
    .from("site_visitors")
    .insert({
      visitor_id: visitorId,
      first_seen_at: nowIso,
      last_seen_at: nowIso,
    });

  if (!insertResult.error) {
    return;
  }

  if (insertResult.error.code !== "23505") {
    throw insertResult.error;
  }

  const retryUpdateResult = await supabaseAdmin
    .from("site_visitors")
    .update({ last_seen_at: nowIso })
    .eq("visitor_id", visitorId);

  if (retryUpdateResult.error) {
    throw retryUpdateResult.error;
  }
}

export async function POST(request) {
  try {
    if (supabaseAdminEnvInfo.serviceKeySource === "placeholder-secret") {
      return NextResponse.json(
        {
          ok: false,
          error: "Visitor counter unavailable",
          count: null,
          excluded: false,
        },
        { status: 503 }
      );
    }

    const body = await getRequestBody(request);
    const visitorId = normalizeVisitorId(body?.visitorId || getVisitorIdFromCookie(request));
    const ownerVisitorId = process.env.OWNER_VISITOR_ID?.trim();
    const incomingVisitorId = String(visitorId || "").trim();
    const isOwner =
      Boolean(ownerVisitorId) &&
      incomingVisitorId === ownerVisitorId;

    if (!isValidVisitorId(visitorId)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid visitorId",
          count: null,
          excluded: false,
        },
        { status: 400 }
      );
    }

    const ownerIpExcluded = isConfiguredOwnerIp(request);
    const excluded = isOwner || ownerIpExcluded;

    if (!excluded) {
      await upsertVisitor(visitorId, new Date().toISOString());
    }

    const excludedVisitorIds = new Set();

    if (ownerVisitorId) {
      excludedVisitorIds.add(ownerVisitorId);
    }

    if (ownerIpExcluded) {
      excludedVisitorIds.add(visitorId);
    }

    const count = await getPublicVisitorCount([...excludedVisitorIds]);

    const response = NextResponse.json({
      ok: true,
      count,
      excluded,
    });

    response.cookies.set("visitor_id", visitorId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    logVisitorsError("post", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Visitor counter unavailable",
        count: null,
        excluded: false,
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  try {
    if (supabaseAdminEnvInfo.serviceKeySource === "placeholder-secret") {
      return NextResponse.json(
        {
          ok: false,
          error: "Visitor counter unavailable",
          count: null,
        },
        { status: 503 }
      );
    }

    const ownerVisitorId = process.env.OWNER_VISITOR_ID?.trim();
    const excludedVisitorIds = ownerVisitorId ? [ownerVisitorId] : [];
    const count = await getPublicVisitorCount(excludedVisitorIds);

    return NextResponse.json({
      ok: true,
      count,
    });
  } catch (error) {
    logVisitorsError("get", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Visitor counter unavailable",
        count: null,
      },
      { status: 503 }
    );
  }
}
