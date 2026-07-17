"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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

export default function VisitorTracker() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const dedupeKey = `tracked_page_view:${pathname}`;

    if (window.sessionStorage.getItem(dedupeKey)) {
      return;
    }

    const visitorId = getVisitorId();

    async function trackVisitor() {
      try {
        const response = await fetch("/api/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId,
            path: pathname,
          }),
        });

        const details = await response.text().catch(() => "");

        if (response.ok) {
          window.sessionStorage.setItem(dedupeKey, "1");
        }

        if (!response.ok) {
          console.error("Visitor tracker request failed", {
            status: response.status,
            statusText: response.statusText,
            path: pathname,
            visitorId,
            details,
          });
        }
      } catch (error) {
        console.error("Visitor tracker error:", error);
      }
    }

    trackVisitor();
  }, [pathname]);

  return null;
}