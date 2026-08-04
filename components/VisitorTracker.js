"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const VISITOR_STORAGE_KEY = "softsystems_visitor_id";

function getOrCreateVisitorId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    let visitorId = window.localStorage.getItem(VISITOR_STORAGE_KEY);

    if (!visitorId) {
      visitorId = window.crypto.randomUUID();
      window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    }

    return visitorId;
  } catch {
    return null;
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
