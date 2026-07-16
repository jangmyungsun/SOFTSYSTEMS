"use client";

import { useEffect, useState } from "react";

function generateVisitorId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AboutPage() {
  const [visitorCount, setVisitorCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function registerVisit() {
      const storedVisitorId = window.localStorage.getItem("visitor_id");
      const visitorId = storedVisitorId || generateVisitorId();

      if (!storedVisitorId) {
        window.localStorage.setItem("visitor_id", visitorId);
      }

      try {
        const response = await fetch("/api/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: `visitor_id=${visitorId}`,
          },
          body: JSON.stringify({ visitorId }),
        });

        if (!cancelled && response.ok) {
          const payload = await response.json().catch(() => ({}));

          if (payload.counted || payload.owner) {
            const countResponse = await fetch("/api/visitors");
            if (!cancelled && countResponse.ok) {
              const countPayload = await countResponse.json().catch(() => ({}));
              setVisitorCount(countPayload.count ?? null);
            }
          }
        }
      } catch (error) {
        console.error("Visitor count error:", error);
      }
    }

    async function loadCount() {
      try {
        const response = await fetch("/api/visitors");
        if (!cancelled && response.ok) {
          const payload = await response.json().catch(() => ({}));
          setVisitorCount(payload.count ?? null);
        }
      } catch (error) {
        console.error("Visitor count load error:", error);
      }
    }

    loadCount();
    registerVisit();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="panel">
        <p className="eyebrow">
          About
        </p>

        <h1>
          Jang Myung Sun
        </h1>

        <p className="subtitle">
          Sound-based media artist
          working with body,
          sensation, everyday life,
          and systems of
          observation.
        </p>
      </section>

      <section className="panel">
        <h2>
          Practice
        </h2>

        <p>
          Jang Myung Sun is a
          sound-based media artist
          who translates bodily
          states, sensations, and
          everyday environments
          into sound, image, text,
          video, performance, and
          digital systems.
        </p>

        <p>
          Her work begins with the
          body as a sensing and
          responsive system. Rather
          than treating the body as
          an object of
          representation, she
          observes how it reacts,
          adapts, remembers, and
          connects with its
          surroundings.
        </p>
      </section>

      <section className="panel">
        <h2>
          SOFTSYSTEMS
        </h2>

        <p>
          SOFTSYSTEMS is an
          evolving artistic
          ecology that gathers
          Daily records, writing,
          media, body data, and
          creative processes.
        </p>

        <p>
          Through Input, Process,
          and Output, the system
          traces relationships
          among body,
          environment, memory,
          and artistic practice.
        </p>
      </section>

      <section className="panel">
        <h2>
          Contact
        </h2>

        <div className="grid three">
          <div>
            <p className="label">
              Email
            </p>

            <a href="mailto:jangms5999@gmail.com">
              jangms5999@gmail.com
            </a>
          </div>

          <div>
            <p className="label">
              Instagram
            </p>

            <a
              href="https://www.instagram.com/jangmyungsun_/"
              target="_blank"
              rel="noreferrer"
            >
              @jangmyungsun_
            </a>
          </div>

          <div>
            <p className="label">
              Portfolio
            </p>

            <a
              href="https://617068.cargo.site/"
              target="_blank"
              rel="noreferrer"
            >
              View Portfolio ↗
            </a>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="muted">
          {visitorCount === null ? "Counting visitors…" : `${visitorCount} visitors have passed through this system.`}
        </p>
      </section>
    </>
  );
}
