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

function isValidVisitorId(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request) {
  const visitorId = getVisitorId(request);

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

  if (existing) {
    return NextResponse.json({ counted: false, duplicate: true });
  }

  const { error } = await supabaseAdmin.from("site_visitors").insert({
    visitor_id: visitorId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ counted: true });
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
