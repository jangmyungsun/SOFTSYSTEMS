import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../lib/supabaseAdmin";

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

async function getRequestBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
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

export async function POST(request) {
  const body = await getRequestBody(request);
  const visitorId = body?.visitorId || getVisitorId(request);
  const pagePath = getPagePath(body?.path);

  if (!isValidVisitorId(visitorId)) {
    return NextResponse.json({ error: "Invalid visitor id." }, { status: 400 });
  }

  const accessToken = getAuthToken(request);

  if (accessToken) {
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!userError && user) {
      return NextResponse.json({ counted: false, owner: true });
    }
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("site_visitors")
    .select("id")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  let counted = false;

  if (existing) {
    const { error: updateError } = await supabaseAdmin
      .from("site_visitors")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { error } = await supabaseAdmin.from("site_visitors").insert({
      visitor_id: visitorId,
      first_page: pagePath,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    counted = true;
  }

  const cutoff = new Date(Date.now() - 30 * 1000).toISOString();
  const { data: recentViews, error: recentViewError } = await supabaseAdmin
    .from("site_page_views")
    .select("id")
    .eq("visitor_id", visitorId)
    .eq("page_path", pagePath)
    .gte("created_at", cutoff)
    .limit(1);

  if (recentViewError) {
    return NextResponse.json({ error: recentViewError.message }, { status: 500 });
  }

  let viewCounted = false;

  if (!recentViews || recentViews.length === 0) {
    const { error: pageViewError } = await supabaseAdmin.from("site_page_views").insert({
      visitor_id: visitorId,
      page_path: pagePath,
    });

    if (pageViewError) {
      return NextResponse.json({ error: pageViewError.message }, { status: 500 });
    }

    viewCounted = true;
  }

  const response = NextResponse.json({
    counted,
    duplicate: !counted,
    viewCounted,
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
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
