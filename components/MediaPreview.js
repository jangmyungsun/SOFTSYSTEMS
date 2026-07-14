"use client";

import {
  useEffect,
  useState,
} from "react";

export default function MediaPreview({
  logId,
  item,
}) {
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
              "Media URL request failed."
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
          Loading media…
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
          {item?.type || "file"} —{" "}
          {item?.name || "Untitled"}
        </p>

        <p className="muted">
          Preview unavailable.
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
          {mediaType} —{" "}
          {item?.name || "Untitled"}
        </p>

        <a
          className="button-link"
          href={signedUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open
        </a>
      </div>

      {mediaType === "image" && (
        <img
          className="media-image"
          src={signedUrl}
          alt={
            item?.name ||
            "Collected image"
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
            "Collected PDF"
          }
        />
      )}
    </div>
  );
}
