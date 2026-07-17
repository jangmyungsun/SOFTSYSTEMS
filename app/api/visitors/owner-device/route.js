import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const OWNER_DEVICE_COOKIE = "softsystems_owner_device";
const OWNER_DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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

function hasOwnerDeviceCookie(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return /(?:^|;\s*)softsystems_owner_device=1(?:;|$)/.test(cookieHeader);
}

export async function GET(request) {
  const ownerCheck = await requireOwner(request);

  if (ownerCheck.error) {
    return NextResponse.json({ error: ownerCheck.error }, { status: ownerCheck.status });
  }

  return NextResponse.json({ excluded: hasOwnerDeviceCookie(request) });
}

export async function POST(request) {
  const ownerCheck = await requireOwner(request);

  if (ownerCheck.error) {
    return NextResponse.json({ error: ownerCheck.error }, { status: ownerCheck.status });
  }

  const response = NextResponse.json({ ok: true, excluded: true });

  response.cookies.set(OWNER_DEVICE_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OWNER_DEVICE_COOKIE_MAX_AGE,
  });

  return response;
}

export async function DELETE(request) {
  const ownerCheck = await requireOwner(request);

  if (ownerCheck.error) {
    return NextResponse.json({ error: ownerCheck.error }, { status: ownerCheck.status });
  }

  const response = NextResponse.json({ ok: true, excluded: false });

  response.cookies.set(OWNER_DEVICE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
