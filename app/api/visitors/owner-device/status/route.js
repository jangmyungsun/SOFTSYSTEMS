import { NextResponse } from "next/server";

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

export async function GET(request) {
  const cookieDetectedServerSide = hasOwnerDeviceCookie(request);

  return NextResponse.json({
    excluded: cookieDetectedServerSide,
    cookieDetectedServerSide,
    host: getHostName(request),
    cookieName: OWNER_DEVICE_COOKIE,
  });
}
