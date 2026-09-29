"use client";

import { useLanguage } from "./LanguageProvider";

export default function SiteHero() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

  return (
    <section className="panel hero stitched-hero">
      <div className="hero-meta-row">
        <p className="eyebrow">SOFTSYSTEMS</p>
        <p className="hero-index">body · environment · practice · creation</p>
      </div>

      <div className="stitched-title-shell">
        <h1 className="stitched-title">
          {t("layout.heroTitle")}
        </h1>

        <div className="hero-thread-trace" aria-hidden="true">
          <span className="hero-thread-hole" />
          <span className="hero-thread-line" />
          <span className="hero-thread-hole" />
          <span className="hero-thread-line short" />
          <span className="hero-thread-hole" />
        </div>
      </div>

      <p className="subtitle hero-subtitle">
        {t("layout.heroSubtitle")}
      </p>

      <div className="hero-score" aria-hidden="true">
        <span>00</span>
        <i />
        <span>INPUT</span>
        <i />
        <span>PROCESS</span>
        <i />
        <span>OUTPUT</span>
        <i />
        <span>ARCHIVE</span>
      </div>
    </section>
  );
}
