import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

function getAccessToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function getOwnerIdentifiers() {
  return {
    userIds: [process.env.OWNER_USER_ID, process.env.ADMIN_USER_ID].filter(Boolean),
    emails: [process.env.OWNER_EMAIL, process.env.ADMIN_EMAIL]
      .filter(Boolean)
      .map((value) => value.toLowerCase()),
  };
}

function isConfiguredOwner(user) {
  if (!user) {
    return false;
  }

  const { userIds, emails } = getOwnerIdentifiers();

  if (userIds.includes(user.id)) {
    return true;
  }

  const email = user.email?.toLowerCase();
  return Boolean(email && emails.includes(email));
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

function isMissingSessionsTable(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();

  return code === "PGRST205" && (message.includes("site_visitor_sessions") || details.includes("site_visitor_sessions"));
}

async function requireOwner(request) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return { error: "Authentication is required.", status: 401 };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return { error: "Invalid authentication.", status: 401 };
  }

  if (!isConfiguredOwner(user)) {
    return { error: "Owner access is required.", status: 403 };
  }

  return { user };
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request) {
  const ownerCheck = await requireOwner(request);

  if (ownerCheck.error) {
    return NextResponse.json({ error: ownerCheck.error }, { status: ownerCheck.status });
  }

  const body = await parseJsonBody(request);

  if (body?.confirm !== true) {
    return NextResponse.json(
      { error: "Explicit confirmation is required." },
      { status: 400 }
    );
  }

  const visitorId = getVisitorIdFromCookie(request);

  if (!visitorId) {
    return NextResponse.json(
      { error: "No visitor_id cookie found for this browser." },
      { status: 400 }
    );
  }

  const pageViewDelete = await supabaseAdmin
    .from("site_page_views")
    .delete()
    .eq("visitor_id", visitorId)
    .select("id", { count: "exact" });

  if (pageViewDelete.error) {
    return NextResponse.json(
      { error: pageViewDelete.error.message, code: pageViewDelete.error.code },
      { status: 500 }
    );
  }

  let deletedSessions = 0;

  const sessionDelete = await supabaseAdmin
    .from("site_visitor_sessions")
    .delete()
    .eq("visitor_id", visitorId)
    .select("session_id", { count: "exact" });

  if (sessionDelete.error && !isMissingSessionsTable(sessionDelete.error)) {
    return NextResponse.json(
      { error: sessionDelete.error.message, code: sessionDelete.error.code },
      { status: 500 }
    );
  }

  if (!sessionDelete.error) {
    deletedSessions = sessionDelete.count || 0;
  }

  const visitorDelete = await supabaseAdmin
    .from("site_visitors")
    .delete()
    .eq("visitor_id", visitorId)
    .select("visitor_id", { count: "exact" });

  if (visitorDelete.error) {
    return NextResponse.json(
      { error: visitorDelete.error.message, code: visitorDelete.error.code },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    visitorId,
    deletedPageViews: pageViewDelete.count || 0,
    deletedSessions,
    deletedVisitors: visitorDelete.count || 0,
  });
}
