import { NextResponse } from "next/server";

function normalizeLocale(value) {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized.startsWith("ko")) {
    return "ko";
  }

  if (normalized.startsWith("ja")) {
    return "ja";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return null;
}

function getLocaleFromCountry(country) {
  if (!country) {
    return "en";
  }

  const normalizedCountry = country.toUpperCase();

  if (normalizedCountry === "KR") {
    return "ko";
  }

  if (normalizedCountry === "JP") {
    return "ja";
  }

  return "en";
}

export async function GET(request) {
  const country = request.headers.get("x-vercel-ip-country") || request.headers.get("x-country") || null;
  const acceptLanguage = request.headers.get("accept-language") || "";
  const browserLocale = normalizeLocale(acceptLanguage.split(",")[0]);

  const suggestedLocale = browserLocale || getLocaleFromCountry(country);

  return NextResponse.json({
    country: country || "",
    suggestedLocale,
  });
}
