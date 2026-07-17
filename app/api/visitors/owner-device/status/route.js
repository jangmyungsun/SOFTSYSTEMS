import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

const OWNER_DEVICE_COOKIE = "softsystems_owner_device";

function hasOwnerDeviceCookie(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return /(?:^|;\s*)softsystems_owner_device=1(?:;|$)/.test(cookieHeader);
}

function getHostName(request) {
  try {
    return new URL(request.url).hostname;
  } catch {
    return "unknown";
  }
}

function getAuthToken(request) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

function isConfiguredOwnerEmail(user) {
  const configuredOwnerEmail = String(process.env.OWNER_EMAIL || "").trim().toLowerCase();
  const userEmail = String(user?.email || "").trim().toLowerCase();

  if (!configuredOwnerEmail || !userEmail) {
    return false;
  }

  return userEmail === configuredOwnerEmail;
}

export async function GET(request) {
  const cookieDetectedServerSide = hasOwnerDeviceCookie(request);
  const accessToken = getAuthToken(request);
  let authenticatedOwnerDetected = false;

  if (accessToken) {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!error && user && isConfiguredOwnerEmail(user)) {
      authenticatedOwnerDetected = true;
    }
  }

  const expectedAnalyticsApiResponse = authenticatedOwnerDetected
    ? { ok: true, ignored: "owner" }
    : cookieDetectedServerSide
      ? { ok: true, ignored: "owner_device" }
      : { ok: true, ignored: "none" };

  return NextResponse.json({
    excluded: cookieDetectedServerSide,
    cookieDetectedServerSide,
    authenticatedOwnerDetected,
    expectedAnalyticsApiResponse,
    host: getHostName(request),
    cookieName: OWNER_DEVICE_COOKIE,
  });
}
