"use client";

import {
  useEffect,
  useState,
} from "react";

import { useLanguage } from "./LanguageProvider";

function translateMediaType(t, value) {
  const key = `media.types.${String(value || "file").toLowerCase()}`;
  const translated = t(key);

  return translated === key ? t("media.types.file") : translated;
}

export default function MediaPreview({
  logId,
  item,
}) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const [signedUrl, setSignedUrl] =
    useState("");

  const [status, setStatus] =
    useState("loading");

  useEffect(() => {
    let active = true;

    async function loadSignedUrl() {
      if (!logId || !item?.path) {
        setStatus("error");
        return;
      }

      try {
        setStatus("loading");

        const response = await fetch(
          "/api/media-url",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              logId,
              filePath: item.path,
            }),
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              t("media.requestFailed")
          );
        }

        if (active) {
          setSignedUrl(
            result.signedUrl
          );

          setStatus("ready");
        }
      } catch (error) {
        console.error(error);

        if (active) {
          setStatus("error");
        }
      }
    }

    loadSignedUrl();

    return () => {
      active = false;
    };
  }, [logId, item?.path]);

  if (status === "loading") {
    return (
      <div className="media-preview">
        <p className="muted">
          {t("media.loading")}
        </p>
      </div>
    );
  }

  if (
    status === "error" ||
    !signedUrl
  ) {
    return (
      <div className="media-preview">
        <p>
          {translateMediaType(
            t,
            item?.type
          )} —{" "}
          {item?.name || t("media.untitled")}
        </p>

        <p className="muted">
          {t("media.previewUnavailable")}
        </p>
      </div>
    );
  }

  const mediaType =
    item?.type || "file";

  return (
    <div className="media-preview">
      <div className="media-preview-head">
        <p>
          {translateMediaType(
            t,
            mediaType
          )} —{" "}
          {item?.name || t("media.untitled")}
        </p>

        <a
          className="button-link"
          href={signedUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t("media.open")}
        </a>
      </div>

      {mediaType === "image" && (
        <img
          className="media-image"
          src={signedUrl}
          alt={
            item?.name ||
            t("media.collectedImage")
          }
        />
      )}

      {mediaType === "audio" && (
        <audio
          className="media-audio"
          controls
          preload="metadata"
          src={signedUrl}
        />
      )}

      {mediaType === "video" && (
        <video
          className="media-video"
          controls
          preload="metadata"
          src={signedUrl}
        />
      )}

      {mediaType === "pdf" && (
        <iframe
          className="media-pdf"
          src={signedUrl}
          title={
            item?.name ||
            t("media.collectedPdf")
          }
        />
      )}
    </div>
  );
}
