import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../lib/supabaseAdmin";

function logVisitorsError(stage, error, context = {}) {
  console.error("[api/visitors]", stage, {
    message: error?.message || String(error),
    ...context,
  });
}

function hasMissingColumn(error, tableName, columnName) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("column") &&
    message.includes(`${tableName.toLowerCase()}.${columnName.toLowerCase()}`)
  );
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
    .select("visitor_id")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (lookupError) {
    logVisitorsError("lookup visitor", lookupError, {
      visitorId,
      pagePath,
      deployedCommit,
    });
    return NextResponse.json({ error: lookupError.message, deployedCommit }, { status: 500 });
  }

  let counted = false;

  if (existing) {
    const { error: updateError } = await supabaseAdmin
      .from("site_visitors")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("visitor_id", existing.visitor_id);

    if (updateError) {
      logVisitorsError("update visitor", updateError, {
        visitorId,
        pagePath,
        existingVisitorId: existing.visitor_id,
        deployedCommit,
      });
      return NextResponse.json({ error: updateError.message, deployedCommit }, { status: 500 });
    }
  } else {
    const insertPayload = {
      visitor_id: visitorId,
      first_page: pagePath,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    };

    let { error } = await supabaseAdmin.from("site_visitors").insert(insertPayload);

    if (error && hasMissingColumn(error, "site_visitors", "first_page")) {
      const fallbackPayload = {
        visitor_id: visitorId,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      };

      const fallbackResult = await supabaseAdmin.from("site_visitors").insert(fallbackPayload);
      error = fallbackResult.error;
    }

    if (error) {
      logVisitorsError("insert visitor", error, {
        visitorId,
        pagePath,
        deployedCommit,
      });
      return NextResponse.json({ error: error.message, deployedCommit }, { status: 500 });
    }

    counted = true;
  }

  const cutoff = new Date(Date.now() - 30 * 1000).toISOString();

  let { data: recentViews, error: recentViewError } = await supabaseAdmin
    .from("site_page_views")
    .select("id")
    .eq("visitor_id", visitorId)
    .eq("page_path", pagePath)
    .gte("created_at", cutoff)
    .limit(1);

  if (recentViewError && hasMissingColumn(recentViewError, "site_page_views", "page_path")) {
    const fallbackRecentResult = await supabaseAdmin
      .from("site_page_views")
      .select("id")
      .eq("visitor_id", visitorId)
      .gte("created_at", cutoff)
      .limit(1);

    recentViews = fallbackRecentResult.data;
    recentViewError = fallbackRecentResult.error;
  }

  if (recentViewError) {
    logVisitorsError("lookup recent page views", recentViewError, {
      visitorId,
      pagePath,
      cutoff,
      deployedCommit,
    });
    return NextResponse.json({ error: recentViewError.message, deployedCommit }, { status: 500 });
  }

  let viewCounted = false;

  if (!recentViews || recentViews.length === 0) {
    let { error: pageViewError } = await supabaseAdmin.from("site_page_views").insert({
      visitor_id: visitorId,
      page_path: pagePath,
    });

    if (pageViewError && hasMissingColumn(pageViewError, "site_page_views", "page_path")) {
      const fallbackPageViewResult = await supabaseAdmin.from("site_page_views").insert({
        visitor_id: visitorId,
      });

      pageViewError = fallbackPageViewResult.error;
    }

    if (pageViewError) {
      logVisitorsError("insert page view", pageViewError, {
        visitorId,
        pagePath,
        deployedCommit,
      });
      return NextResponse.json({ error: pageViewError.message, deployedCommit }, { status: 500 });
    }

    viewCounted = true;
  }

  const response = NextResponse.json({
    counted,
    duplicate: !counted,
    viewCounted,
    deployedCommit,
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
