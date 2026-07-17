"use client";

import { useEffect, useState } from "react";
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
  const [debug, setDebug] = useState({
    called: false,
    skipped: false,
    status: null,
    body: "",
    error: "",
  });

  useEffect(() => {
    const dedupeKey = `tracked_page_view:${pathname}`;

    if (window.sessionStorage.getItem(dedupeKey)) {
      setDebug({
        called: false,
        skipped: true,
        status: null,
        body: "Already tracked this page in this session.",
        error: "",
      });
      return;
    }

    const visitorId = getVisitorId();

    async function trackVisitor() {
      setDebug({
        called: true,
        skipped: false,
        status: null,
        body: "",
        error: "",
      });

      try {
        const response = await fetch("/api/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Visitor-Debug": "1",
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

        setDebug({
          called: true,
          skipped: false,
          status: response.status,
          body: details,
          error: response.ok ? "" : "Request failed.",
        });

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
        setDebug({
          called: true,
          skipped: false,
          status: null,
          body: "",
          error: error?.message || "Unknown error",
        });
        console.error("Visitor tracker error:", error);
      }
    }

    trackVisitor();
  }, [pathname]);

  return (
    <aside
      style={{
        position: "fixed",
        right: "0.75rem",
        bottom: "0.75rem",
        zIndex: 9999,
        maxWidth: "min(90vw, 28rem)",
        background: "rgba(0, 0, 0, 0.82)",
        color: "#f5f5f5",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "0.5rem",
        padding: "0.65rem",
        fontSize: "12px",
        lineHeight: 1.35,
        wordBreak: "break-word",
      }}
    >
      <div><strong>VisitorTracker Debug</strong></div>
      <div>path: {pathname}</div>
      <div>called: {debug.called ? "yes" : "no"}</div>
      <div>session skipped: {debug.skipped ? "yes" : "no"}</div>
      <div>status: {debug.status ?? "n/a"}</div>
      <div>body: {debug.body || "(empty)"}</div>
      <div>error: {debug.error || "(none)"}</div>
    </aside>
  );
}