"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const SESSION_ID_KEY = "analytics_session_id";
const SOURCE_KEY = "analytics_source";
const OWNER_DEVICE_HINT_KEY = "softsystems_owner_device_hint";
const ACTIVITY_INTERVAL_MS = 2 * 60 * 1000;

function generateVisitorId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getVisitorId() {
  const storedVisitorId = window.localStorage.getItem("visitor_id");

  if (storedVisitorId) {
    return storedVisitorId;
  }

  const nextVisitorId = generateVisitorId();
  window.localStorage.setItem("visitor_id", nextVisitorId);
  return nextVisitorId;
}

function normalizeSource(value) {
  const text = String(value || "").trim().toLowerCase();

  if (!text) {
    return "direct";
  }

  if (text.includes("instagram") || text === "ig") {
    return "instagram";
  }

  if (text.includes("threads")) {
    return "threads";
  }

  if (text.includes("google")) {
    return "google";
  }

  if (text.includes("kakao")) {
    return "kakaotalk";
  }

  if (text === "direct") {
    return "direct";
  }

  return "other";
}

function getSourceFromReferrer() {
  if (!document.referrer) {
    return "direct";
  }

  try {
    const host = new URL(document.referrer).hostname.toLowerCase();

    if (host.includes("instagram")) {
      return "instagram";
    }

    if (host.includes("threads")) {
      return "threads";
    }

    if (host.includes("google")) {
      return "google";
    }

    if (host.includes("kakao")) {
      return "kakaotalk";
    }

    return "other";
  } catch {
    return "other";
  }
}

function getSessionSource() {
  const existing = window.sessionStorage.getItem(SOURCE_KEY);

  if (existing) {
    return normalizeSource(existing);
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const source = utmSource ? normalizeSource(utmSource) : getSourceFromReferrer();
  window.sessionStorage.setItem(SOURCE_KEY, source);
  return source;
}

function getSessionId() {
  const existing = window.sessionStorage.getItem(SESSION_ID_KEY);

  if (existing) {
    return existing;
  }

  const next = generateVisitorId();
  window.sessionStorage.setItem(SESSION_ID_KEY, next);
  return next;
}

function setSessionId(nextSessionId) {
  if (typeof nextSessionId === "string" && nextSessionId.trim()) {
    window.sessionStorage.setItem(SESSION_ID_KEY, nextSessionId.trim());
  }
}

function shouldSkipTrackingForOwnerDevice() {
  return window.localStorage.getItem(OWNER_DEVICE_HINT_KEY) === "1";
}

async function getAuthorizationHeader() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    if (!accessToken) {
      return {};
    }

    return {
      authorization: `Bearer ${accessToken}`,
    };
  } catch {
    return {};
  }
}

function sendActivityBeacon(payload) {
  if (!navigator.sendBeacon) {
    return false;
  }

  try {
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });

    return navigator.sendBeacon("/api/visitors", blob);
  } catch {
    return false;
  }
}

export default function VisitorTracker() {
  const pathname = usePathname() || "/";
  const [exclusionReady, setExclusionReady] = useState(false);
  const [serverExcluded, setServerExcluded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadExclusionStatus() {
      try {
        const authHeader = await getAuthorizationHeader();
        const response = await fetch("/api/visitors/owner-device/status", {
          method: "GET",
          credentials: "same-origin",
          headers: {
            ...authHeader,
          },
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        const excluded = Boolean(
          response.ok && (payload?.authenticatedOwnerDetected || payload?.cookieDetectedServerSide)
        );

        if (!active) {
          return;
        }

        setServerExcluded(excluded);

        if (excluded) {
          window.localStorage.setItem(OWNER_DEVICE_HINT_KEY, "1");
        } else {
          window.localStorage.removeItem(OWNER_DEVICE_HINT_KEY);
        }
      } catch {
        if (!active) {
          return;
        }

        setServerExcluded(shouldSkipTrackingForOwnerDevice());
      } finally {
        if (active) {
          setExclusionReady(true);
        }
      }
    }

    loadExclusionStatus();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!exclusionReady) {
      return;
    }

    if (serverExcluded || shouldSkipTrackingForOwnerDevice()) {
      return;
    }

    const dedupeKey = `tracked_page_view:${pathname}`;

    if (window.sessionStorage.getItem(dedupeKey)) {
      return;
    }

    const visitorId = getVisitorId();
    const source = getSessionSource();

    async function trackVisitor() {
      const sessionId = getSessionId();

      try {
        const authHeader = await getAuthorizationHeader();
        const response = await fetch("/api/visitors", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({
            visitorId,
            path: pathname,
            eventType: "page_view",
            sessionId,
            source,
          }),
        });

        const details = await response.text().catch(() => "");
        let payload = null;

        try {
          payload = details ? JSON.parse(details) : null;
        } catch {
          payload = null;
        }

        if (response.ok) {
          if (payload?.ignored === "owner_device" || payload?.ignored === "owner") {
            window.localStorage.setItem(OWNER_DEVICE_HINT_KEY, "1");
          }

          setSessionId(payload?.sessionId);
          window.sessionStorage.setItem(dedupeKey, "1");
        }

        if (!response.ok) {
          console.error("Visitor tracker request failed", {
            status: response.status,
            statusText: response.statusText,
            path: pathname,
            visitorId,
            sessionId,
            source,
            details,
          });
        }
      } catch (error) {
        console.error("Visitor tracker error:", error);
      }
    }

    trackVisitor();
  }, [pathname, exclusionReady, serverExcluded]);

  useEffect(() => {
    if (!exclusionReady) {
      return;
    }

    if (serverExcluded || shouldSkipTrackingForOwnerDevice()) {
      return;
    }

    const visitorId = getVisitorId();
    const source = getSessionSource();

    async function sendActivity() {
      const sessionId = getSessionId();

      try {
        const authHeader = await getAuthorizationHeader();
        const response = await fetch("/api/visitors", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({
            visitorId,
            path: pathname,
            eventType: "activity",
            sessionId,
            source,
          }),
        });

        if (!response.ok) {
          const details = await response.text().catch(() => "");
          console.error("Visitor activity request failed", {
            status: response.status,
            statusText: response.statusText,
            path: pathname,
            visitorId,
            sessionId,
            source,
            details,
          });
          return;
        }

        const payload = await response.json().catch(() => null);

        if (payload?.ignored === "owner_device" || payload?.ignored === "owner") {
          window.localStorage.setItem(OWNER_DEVICE_HINT_KEY, "1");
        }

        setSessionId(payload?.sessionId);
      } catch (error) {
        console.error("Visitor activity error:", error);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        const sessionId = getSessionId();
        const sent = sendActivityBeacon({
          visitorId,
          path: pathname,
          eventType: "activity",
          sessionId,
          source,
        });

        if (!sent) {
          sendActivity();
        }
        return;
      }

      if (document.visibilityState === "visible") {
        sendActivity();
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        sendActivity();
      }
    }, ACTIVITY_INTERVAL_MS);

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, exclusionReady, serverExcluded]);

  return null;
}