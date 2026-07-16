import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../lib/supabaseAdmin";

function getAuthToken(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.replace(/^Bearer\s+/i, "");
}

export async function GET(request) {
  const accessToken = getAuthToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication failed." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("visitor_letters")
    .select("id, name, message, created_at, wants_public, is_public")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ letter: data?.[0] ?? null });
}

export async function POST(request) {
  const accessToken = getAuthToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication failed." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const field = body?.field;
  const value = body?.value;

  if (!field || !["is_public", "wants_public"].includes(field)) {
    return NextResponse.json(
      { error: "Unsupported field." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("visitor_letters")
    .update({ [field]: value })
    .eq("id", body?.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
