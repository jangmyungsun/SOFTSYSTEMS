"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "../../components/LanguageProvider";

function generateVisitorId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AboutPage() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
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
          {t("about.title")}
        </p>

        <h1>
          Jang Myung Sun
        </h1>

        <p className="subtitle">
          {t("about.subtitle")}
        </p>
      </section>

      <section className="panel">
        <h2>
          {t("about.practice")}
        </h2>

        <p>
          {t("about.practiceBody")}
        </p>

        <p>
          {t("about.practiceBody2")}
        </p>
      </section>

      <section className="panel">
        <h2>
          {t("about.systems")}
        </h2>

        <p>
          {t("about.systemsBody")}
        </p>

        <p>
          {t("about.systemsBody2")}
        </p>
      </section>

      <section className="panel">
        <h2>
          {t("about.contact")}
        </h2>

        <div className="grid three">
          <div>
            <p className="label">
              {t("about.email")}
            </p>

            <a href="mailto:jangms5999@gmail.com">
              jangms5999@gmail.com
            </a>
          </div>

          <div>
            <p className="label">
              {t("about.instagram")}
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
              {t("about.portfolio")}
            </p>

            <a
              href="https://617068.cargo.site/"
              target="_blank"
              rel="noreferrer"
            >
              {t("about.viewPortfolio")}
            </a>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="muted">
          {visitorCount === null ? t("about.countLoading") : t("about.count", { count: visitorCount })}
        </p>
      </section>
    </>
  );
}
