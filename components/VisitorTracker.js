"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const VISITOR_ID_KEY = "visitor_id";

function generateVisitorId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isValidVisitorId(value) {
  return /^[A-Za-z0-9-]{8,128}$/.test(String(value || "").trim());
}

function getOrCreateVisitorId() {
  try {
    const storedVisitorId = window.localStorage.getItem(VISITOR_ID_KEY);

    if (isValidVisitorId(storedVisitorId)) {
      return storedVisitorId;
    }

    const nextVisitorId = generateVisitorId();
    window.localStorage.setItem(VISITOR_ID_KEY, nextVisitorId);
    return nextVisitorId;
  } catch {
    return "";
  }
}

async function postVisitor(visitorId) {
  try {
    await fetch("/api/visitors", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visitorId }),
    });
  } catch {
    // Visitor tracking must stay non-critical.
  }
}

export default function VisitorTracker() {
  const ownerDebugLoggedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const visitorId = getOrCreateVisitorId();

    if (!visitorId) {
      return;
    }

    postVisitor(visitorId);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    if (typeof window === "undefined" || ownerDebugLoggedRef.current) {
      return;
    }

    let active = true;

    async function maybeLogOwnerVisitorId() {
      const visitorId = getOrCreateVisitorId();

      if (!visitorId) {
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const accessToken = session?.access_token;

        if (!accessToken) {
          return;
        }

        const response = await fetch("/api/visitors/owner-device/status", {
          method: "GET",
          credentials: "same-origin",
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));

        if (!active) {
          return;
        }

        if (response.ok && payload?.authenticatedOwnerDetected) {
          ownerDebugLoggedRef.current = true;
          // Temporary owner setup helper. Remove after OWNER_VISITOR_ID is configured.
          console.info("[VisitorTracker] OWNER_VISITOR_ID candidate:", visitorId);
        }
      } catch {
        // Ignore debug helper failures.
      }
    }

    maybeLogOwnerVisitorId();

    return () => {
      active = false;
    };
  }, []);

  return null;
}
