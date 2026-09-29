"use client";

import { useLanguage } from "./LanguageProvider";

export default function SiteHero() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

  return (
    <section className="panel hero book-hero book-hero-compact">
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
      </div>
    </section>
  );
}
