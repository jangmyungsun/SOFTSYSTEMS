"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_ID_KEY = "analytics_session_id";
const SOURCE_KEY = "analytics_source";
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

  useEffect(() => {
    const dedupeKey = `tracked_page_view:${pathname}`;

    if (window.sessionStorage.getItem(dedupeKey)) {
      return;
    }

    const visitorId = getVisitorId();
    const source = getSessionSource();

    async function trackVisitor() {
      const sessionId = getSessionId();

      try {
        const response = await fetch("/api/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
  }, [pathname]);

  useEffect(() => {
    const visitorId = getVisitorId();
    const source = getSessionSource();

    async function sendActivity() {
      const sessionId = getSessionId();

      try {
        const response = await fetch("/api/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
  }, [pathname]);

  return null;
}