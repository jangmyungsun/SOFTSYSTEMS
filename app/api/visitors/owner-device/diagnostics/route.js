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

function hasOwnerDeviceCookie(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return /(?:^|;\s*)softsystems_owner_device=1(?:;|$)/.test(cookieHeader);
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

export async function GET(request) {
  const ownerCheck = await requireOwner(request);

  if (ownerCheck.error) {
    return NextResponse.json({ error: ownerCheck.error }, { status: ownerCheck.status });
  }

  const visitorId = getVisitorIdFromCookie(request);
  const ownerDeviceCookieDetected = hasOwnerDeviceCookie(request);

  if (!visitorId) {
    return NextResponse.json({
      visitorId: "",
      visitorExistsInSiteVisitors: false,
      lastSeenAt: null,
      ownerDeviceCookieDetected,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("site_visitors")
    .select("visitor_id,last_seen_at")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code || null,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    visitorId,
    visitorExistsInSiteVisitors: Boolean(data?.visitor_id),
    lastSeenAt: data?.last_seen_at || null,
    ownerDeviceCookieDetected,
  });
}
