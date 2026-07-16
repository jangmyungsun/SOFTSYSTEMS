"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabaseClient";
import { getIntlLocale } from "../lib/i18n";
import { getAttachmentKind, formatFileSize } from "../lib/dailyAttachments";
import { useLanguage } from "./LanguageProvider";

function formatDate(value, locale) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(getIntlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function translateAttachmentType(t, kind) {
  const keyMap = {
    image: "media.types.image",
    audio: "media.types.audio",
    video: "media.types.video",
    pdf: "media.types.pdf",
    document: "media.types.file",
    file: "media.types.file",
  };

  return t(keyMap[kind] || keyMap.file);
}

export default function MediaPreview({ attachment }) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const locale = language?.locale ?? "en";

  const [signedUrl, setSignedUrl] = useState("");
  const [status, setStatus] = useState("loading");

  const kind = getAttachmentKind({
    type: attachment?.mime_type,
    name: attachment?.original_filename,
  });

  useEffect(() => {
    let mounted = true;

    async function loadSignedUrl() {
      if (!attachment?.id) {
        setStatus("error");
        return;
      }

      try {
        setStatus("loading");

        const {
          data: sessionData,
        } = await supabase.auth.getSession();

        const accessToken =
          sessionData?.session?.access_token || "";

        const response = await fetch(
          `/api/daily/attachments/${attachment.id}`,
          {
            headers: {
              ...(accessToken
                ? {
                    Authorization: `Bearer ${accessToken}`,
                  }
                : {}),
            },
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result?.signedUrl) {
          throw new Error(result?.error || t("media.requestFailed"));
        }

        if (mounted) {
          setSignedUrl(result.signedUrl);
          setStatus("ready");
        }
      } catch (error) {
        console.error("Attachment preview error:", error);

        if (mounted) {
          setStatus("error");
        }
      }
    }

    loadSignedUrl();

    return () => {
      mounted = false;
    };
  }, [attachment?.id, t]);

  async function handleDownload() {
    if (!attachment?.id) {
      return;
    }

    try {
      const {
        data: sessionData,
      } = await supabase.auth.getSession();

      const accessToken = sessionData?.session?.access_token || "";

      const response = await fetch(
        `/api/daily/attachments/${attachment.id}?download=1`,
        {
          headers: {
            ...(accessToken
              ? {
                  Authorization: `Bearer ${accessToken}`,
                }
              : {}),
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.signedUrl) {
        throw new Error(result?.error || t("media.requestFailed"));
      }

      window.location.href = result.signedUrl;
    } catch (error) {
      console.error("Attachment download error:", error);

      if (signedUrl) {
        window.open(signedUrl, "_blank", "noreferrer");
      }
    }
  }

  if (status === "loading") {
    return (
      <div className="media-preview">
        <p className="muted">{t("media.loading")}</p>
      </div>
    );
  }

  if (status === "error" || !signedUrl) {
    return (
      <div className="media-preview">
        <p>
          {translateAttachmentType(t, kind)} — {attachment?.original_filename || t("media.untitled")}
        </p>

        <p className="muted">{t("media.previewUnavailable")}</p>
      </div>
    );
  }

  return (
    <div className="media-preview">
      <div className="media-preview-head">
        <div>
          <p>
            {translateAttachmentType(t, kind)} — {attachment?.original_filename || t("media.untitled")}
          </p>

          <p className="muted">
            {[formatFileSize(attachment?.size_bytes), formatDate(attachment?.created_at, locale)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="actions">
          <a className="button-link" href={signedUrl} target="_blank" rel="noreferrer">
            {t("media.open")}
          </a>

          <button type="button" className="translate-toggle" onClick={handleDownload}>
            {t("media.download")}
          </button>
        </div>
      </div>

      {kind === "image" && (
        <img className="media-image" src={signedUrl} alt={attachment?.original_filename || t("media.collectedImage")} />
      )}

      {kind === "audio" && <audio className="media-audio" controls preload="metadata" src={signedUrl} />}

      {kind === "video" && <video className="media-video" controls preload="metadata" src={signedUrl} />}

      {kind === "pdf" && (
        <iframe className="media-pdf" src={signedUrl} title={attachment?.original_filename || t("media.collectedPdf")} />
      )}
    </div>
  );
}