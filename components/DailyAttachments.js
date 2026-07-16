"use client";

import { useLanguage } from "./LanguageProvider";
import MediaPreview from "./MediaPreview";

export default function DailyAttachments({
  attachments = [],
  label,
}) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

  const normalizedAttachments = Array.isArray(attachments)
    ? attachments
    : [];

  if (!normalizedAttachments.length) {
    return <p className="muted">{t("media.noAttachments")}</p>;
  }

  return (
    <details className="daily-attachments">
      <summary className="daily-attachments-summary">
        <span>{label || t("media.attachments")}</span>
        <span className="muted">
          {normalizedAttachments.length}
        </span>
      </summary>

      <div className="daily-attachments-list">
        {normalizedAttachments.map((attachment) => (
          <article className="daily-attachment-item" key={attachment.id || attachment.storage_path}>
            <MediaPreview attachment={attachment} />
          </article>
        ))}
      </div>
    </details>
  );
}