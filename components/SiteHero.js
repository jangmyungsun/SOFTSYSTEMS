"use client";

import { useLanguage } from "./LanguageProvider";

function HeroThreadLine() {
  return (
    <svg
      className="hero-thread-svg"
      viewBox="0 0 760 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="hero-thread-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ddd4c0" />
          <stop offset="38%" stopColor="#f6f1e5" />
          <stop offset="64%" stopColor="#2c8a95" />
          <stop offset="100%" stopColor="#ddd4c0" />
        </linearGradient>
        <filter id="hero-thread-shadow" x="-10%" y="-30%" width="120%" height="180%">
          <feDropShadow dx="0.3" dy="1.2" stdDeviation="1.2" floodColor="rgba(22,20,18,0.24)" />
        </filter>
      </defs>

      <circle cx="14" cy="66" r="3.2" className="thread-hole-fill" />
      <circle cx="14" cy="66" r="3.2" className="thread-hole-ring" />
      <circle cx="152" cy="57" r="2.9" className="thread-hole-fill" />
      <circle cx="152" cy="57" r="2.9" className="thread-hole-ring" />
      <circle cx="318" cy="44" r="2.9" className="thread-hole-fill" />
      <circle cx="318" cy="44" r="2.9" className="thread-hole-ring" />
      <circle cx="516" cy="68" r="3" className="thread-hole-fill" />
      <circle cx="516" cy="68" r="3" className="thread-hole-ring" />
      <circle cx="742" cy="54" r="3.2" className="thread-hole-fill" />
      <circle cx="742" cy="54" r="3.2" className="thread-hole-ring" />

      <path
        d="M14 66 C 66 80, 110 48, 152 57 C 194 66, 250 28, 318 44 C 396 62, 446 82, 516 68 C 602 50, 672 49, 742 54"
        stroke="url(#hero-thread-gradient)"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#hero-thread-shadow)"
      />
      <path
        d="M14 66 C 66 80, 110 48, 152 57 C 194 66, 250 28, 318 44 C 396 62, 446 82, 516 68 C 602 50, 672 49, 742 54"
        stroke="rgba(255,255,255,0.62)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <path d="M6 62 C 8 58, 10 56, 14 58" className="thread-tail" />
      <path d="M742 54 C 748 50, 752 54, 757 47" className="thread-tail" />
    </svg>
  );
}

export default function SiteHero() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

  return (
    <section className="panel hero thread-hero">
      <div className="hero-meta-row">
        <p className="eyebrow">SOFTSYSTEMS</p>
        <p className="hero-index">body · environment · practice · creation</p>
      </div>

      <div className="thread-title-shell">
        <h1 className="thread-title">{t("layout.heroTitle")}</h1>
        <HeroThreadLine />
      </div>

      <p className="subtitle hero-subtitle">{t("layout.heroSubtitle")}</p>

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
