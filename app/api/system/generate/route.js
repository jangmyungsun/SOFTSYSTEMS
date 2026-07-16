import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function getOwnerIdentifiers() {
  return {
    userIds: [
      process.env.OWNER_USER_ID,
      process.env.ADMIN_USER_ID,
    ].filter(Boolean),

    emails: [
      process.env.OWNER_EMAIL,
      process.env.ADMIN_EMAIL,
    ]
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

function resolveLocale(request) {
  const url = new URL(request.url);
  const queryLocale = url.searchParams.get("locale");

  if (queryLocale) {
    return queryLocale;
  }

  return request.headers.get("x-softsystems-locale") || "en";
}

async function proxyCronRun(request, locale) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron secret is not configured." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  url.pathname = "/api/cron/nightly";
  url.searchParams.set("locale", locale);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${cronSecret}`,
      "x-softsystems-locale": locale,
    },
  });

  const payload = await response.json().catch(() => null);

  return NextResponse.json(payload ?? {}, {
    status: response.status,
  });
}

export async function GET(request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!accessToken) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data?.user) {
    return NextResponse.json(
      { error: "Invalid authentication." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    owner: isConfiguredOwner(data.user),
  });
}

export async function POST(request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!accessToken) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data?.user) {
    return NextResponse.json(
      { error: "Invalid authentication." },
      { status: 401 }
    );
  }

  if (!isConfiguredOwner(data.user)) {
    return NextResponse.json(
      { error: "Owner access is required." },
      { status: 403 }
    );
  }

  const locale = resolveLocale(request);

  return proxyCronRun(request, locale);
}
