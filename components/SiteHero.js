"use client";

import { useLanguage } from "./LanguageProvider";

export default function SiteHero() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

  return (
    <section className="panel hero">
      <p className="eyebrow">SOFTSYSTEMS</p>

      <h1>{t("layout.heroTitle")}</h1>

      <p className="subtitle">{t("layout.heroSubtitle")}</p>
    </section>
  );
}