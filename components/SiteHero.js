"use client";

import { useLanguage } from "./LanguageProvider";

export default function SiteHero() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

  return (
    <section className="panel hero book-hero">
      <div className="book-hero-topline">
        <p className="eyebrow">SOFTSYSTEMS</p>
        <p className="book-hero-edition">living archive · 2026</p>
      </div>

      <div className="book-hero-stage">
        <div className="book-hero-copy">
          <h1 className="book-hero-title">{t("layout.heroTitle")}</h1>
          <p className="subtitle book-hero-subtitle">
            {t("layout.heroSubtitle")}
          </p>
        </div>

        <div className="book-fragment fragment-one" aria-hidden="true">
          body<br />environment
        </div>
        <div className="book-fragment fragment-two" aria-hidden="true">
          practice · memory · creation
        </div>
        <div className="book-fragment fragment-three" aria-hidden="true">
          · ·<br />×
        </div>
      </div>

      <div className="book-hero-index" aria-hidden="true">
        <span>01 / INPUT</span>
        <span>02 / PROCESS</span>
        <span>03 / OUTPUT</span>
        <span>04 / ARCHIVE</span>
      </div>
    </section>
  );
}
