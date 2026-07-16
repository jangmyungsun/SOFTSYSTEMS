"use client";

import { useLanguage } from "../../components/LanguageProvider";

export default function OutputPage() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

  return (
    <>
      <section className="panel hero">
        <p className="eyebrow">
          {t("output.eyebrow")}
        </p>

        <h1>
          {t("output.title")}
        </h1>

        <p className="subtitle">
          {t("output.subtitle")}
        </p>
      </section>

      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              {t("output.portfolio")}
            </p>

            <h2>
              {t("output.portfolioHeading")}
            </h2>
          </div>
        </div>

        <p className="subtitle">
          {t("output.portfolioBody")}
        </p>

        <div className="actions">
          <a
            className="button-link primary"
            href="https://617068.cargo.site/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("output.openPortfolio")}
          </a>
        </div>
      </section>
    </>
  );
}