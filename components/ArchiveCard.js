"use client";

import {
  useMemo,
  useState,
} from "react";

import TranslateButton from "./TranslateButton";
import { useLanguage } from "./LanguageProvider";
import {
  formatAttachmentSize,
  getAttachmentTypeLabelKey,
  isImageAttachment,
} from "../lib/archiveAttachments";

function toValueKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatLabel(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getSafeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function shortenText(
  value,
  maxLength = 180
) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) {
    return text;
  }

  return (
    text.slice(0, maxLength) +
    "…"
  );
}

function getYoutubeVideoId(url) {
  if (!url) {
    return "";
  }

  try {
    if (
      url.includes("youtu.be/")
    ) {
      return (
        url
          .split("youtu.be/")[1]
          ?.split(/[?&]/)[0] ||
        ""
      );
    }

    const parsed =
      new URL(url);

    if (
      parsed.hostname.includes(
        "youtube.com"
      )
    ) {
      if (
        parsed.pathname.startsWith(
          "/shorts/"
        )
      ) {
        return (
          parsed.pathname
            .split("/shorts/")[1]
            ?.split("/")[0] ||
          ""
        );
      }

      if (
        parsed.pathname.startsWith(
          "/embed/"
        )
      ) {
        return (
          parsed.pathname
            .split("/embed/")[1]
            ?.split("/")[0] ||
          ""
        );
      }

      return (
        parsed.searchParams.get(
          "v"
        ) || ""
      );
    }
  } catch {
    return "";
  }

  return "";
}

function getYoutubeThumbnail(url) {
  const videoId =
    getYoutubeVideoId(url);

  if (!videoId) {
    return "";
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function getYoutubeEmbedUrl(url) {
  const videoId =
    getYoutubeVideoId(url);

  if (!videoId) {
    return "";
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

export default function ArchiveCard({
  entry,
  admin = false,
  canDelete = false,
  deleting = false,
  deleteLabel = "",
  toggleLabel = "",
  disableActions = false,
  onEdit,
  onDelete,
  onToggle,
  requestAccessToken,
}) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    attachmentUrls,
    setAttachmentUrls,
  ] = useState({});

  const [
    loadingAttachmentId,
    setLoadingAttachmentId,
  ] = useState("");

  const tags =
    getSafeArray(
      entry.tags
    );

  const attachments =
    getSafeArray(
      entry.attachments
    );

  const attachmentSummary =
    useMemo(() => {
      const initialValue = {
        total:
          attachments.length,
        imageCount: 0,
        bookCount: 0,
        documentCount: 0,
      };

      return attachments.reduce(
        (summary, attachment) => {
          const type = String(
            attachment?.attachment_type ||
              ""
          ).toLowerCase();

          if (type === "image") {
            summary.imageCount += 1;
          } else if (
            type === "book"
          ) {
            summary.bookCount += 1;
          } else if (
            type ===
            "document"
          ) {
            summary.documentCount +=
              1;
          }

          return summary;
        },
        initialValue
      );
    }, [attachments]);

  const isVideo =
    entry.type === "video";

  const thumbnail =
    isVideo
      ? getYoutubeThumbnail(
          entry.url
        )
      : "";

  const embedUrl =
    isVideo
      ? getYoutubeEmbedUrl(
          entry.url
        )
      : "";

  const closeModal = () => {
    setIsOpen(false);
  };

  const fetchAttachmentUrl =
    async (
      attachmentId,
      {
        download = false,
      } = {}
    ) => {
      const query =
        download
          ? "?download=1"
          : "";
      const headers = {};

      if (requestAccessToken) {
        try {
          const token =
            await requestAccessToken();

          if (token) {
            headers.Authorization =
              `Bearer ${token}`;
          }
        } catch {
          /* public archive access can continue without auth */
        }
      }

      const response =
        await fetch(
          `/api/archive/attachments/${encodeURIComponent(attachmentId)}${query}`,
          {
            headers,
          }
        );

      const payload =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            t(
              "archiveForm.attachmentUploadFailed"
            )
        );
      }

      if (!payload?.signed_url) {
        throw new Error(
          t(
            "archiveForm.attachmentUploadFailed"
          )
        );
      }

      return payload.signed_url;
    };

  const openAttachment =
    async (
      attachment,
      {
        download = false,
      } = {}
    ) => {
      const attachmentId =
        String(
          attachment?.id || ""
        ).trim();

      if (!attachmentId) {
        return;
      }

      setLoadingAttachmentId(
        attachmentId
      );

      try {
        const signedUrl =
          await fetchAttachmentUrl(
            attachmentId,
            {
              download,
            }
          );

        setAttachmentUrls(
          (previous) => ({
            ...previous,
            [attachmentId]:
              signedUrl,
          })
        );

        window.open(
          signedUrl,
          "_blank",
          "noopener,noreferrer"
        );
      } catch (error) {
        window.alert(
          error?.message ||
            t(
              "archiveForm.attachmentUploadFailed"
            )
        );
      } finally {
        setLoadingAttachmentId(
          ""
        );
      }
    };

  const loadImagePreview =
    async (
      attachment
    ) => {
      const attachmentId =
        String(
          attachment?.id || ""
        ).trim();

      if (
        !attachmentId ||
        attachmentUrls[
          attachmentId
        ]
      ) {
        return;
      }

      try {
        const signedUrl =
          await fetchAttachmentUrl(
            attachmentId
          );

        setAttachmentUrls(
          (previous) => ({
            ...previous,
            [attachmentId]:
              signedUrl,
          })
        );
      } catch {
        /* keep placeholder when preview cannot be loaded */
      }
    };

  return (
    <>
      <article
        className={
          isVideo
            ? "archive-preview-card archive-video-card"
            : "archive-preview-card archive-text-card"
        }
      >
        <div className="archive-preview-main">
          {isVideo ? (
            <>
              {thumbnail ? (
                <img
                  className="archive-preview-image"
                  src={thumbnail}
                  alt=""
                />
              ) : (
                <div className="archive-preview-placeholder">
                  {t("common.video")}
                </div>
              )}

              <div className="archive-video-shade" />

              <div className="archive-video-content">
                <p className="eyebrow">
                  {t("common.video")}
                </p>

                <h2>
                  <TranslateButton
                    text={entry.title || ""}
                    sourceLanguage="en"
                    contentKey={`archive:${entry.id || entry.title || "entry"}:title`}
                    className="translate-block"
                    as="span"
                    showControls={false}
                  />
                </h2>

                <p className="muted">
                  {entry.entry_date}
                </p>
              </div>
            </>
          ) : (
            <div className="archive-text-content">
              <div>
                <p className="eyebrow">
                  {t(`archive.types.${toValueKey(entry.type)}`) !== `archive.types.${toValueKey(entry.type)}`
                    ? t(`archive.types.${toValueKey(entry.type)}`)
                    : formatLabel(entry.type)}
                </p>

                <h2>
                  <TranslateButton
                    text={entry.title || ""}
                    sourceLanguage="en"
                    contentKey={`archive:${entry.id || entry.title || "entry"}:title`}
                    className="translate-block"
                    as="span"
                    showControls={false}
                  />
                </h2>

                <p className="muted">
                  {entry.entry_date}
                </p>
              </div>

              <p className="archive-preview-excerpt">
                <TranslateButton
                  text={shortenText(
                    entry.body,
                    190
                  ) ||
                    t("common.noPreviewText")}
                  sourceLanguage="en"
                  contentKey={`archive:${entry.id || entry.title || "entry"}:excerpt`}
                  className="translate-block"
                  as="span"
                  showControls={false}
                />
              </p>

              {tags.length > 0 && (
                <div className="tag-list archive-preview-tags">
                  {tags
                    .slice(0, 3)
                    .map(
                      (
                        tag,
                        index
                      ) => (
                        <span
                          className="tag"
                          key={`${tag}-${index}`}
                        >
                          {tag}
                        </span>
                      )
                    )}
                </div>
              )}

              {attachmentSummary.total >
                0 && (
                <p className="muted archive-attachment-hint">
                  {attachmentSummary.imageCount >
                  0
                    ? `${t("common.image")} · `
                    : attachmentSummary.bookCount >
                      0
                    ? `${t("common.bookFile")} · `
                    : `${t("common.document")} · `}
                  {attachmentSummary.total} {t("common.attachments")}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="archive-preview-footer">
          <button
            type="button"
            className="archive-view-button"
            onClick={() =>
              setIsOpen(true)
            }
          >
            {t("common.viewMore")}
          </button>
        </div>

        {admin && (
          <div className="archive-card-actions">
            <button
              type="button"
              disabled={
                disableActions
              }
              onClick={() =>
                onEdit?.(entry)
              }
            >
              {t("common.edit")}
            </button>

            <button
              type="button"
              disabled={
                disableActions
              }
              onClick={() =>
                onToggle?.(entry)
              }
            >
              {toggleLabel ||
                (entry.is_public
                  ? t("common.private")
                  : t("common.public"))}
            </button>

            {canDelete && (
              <button
                type="button"
                disabled={
                  disableActions
                }
                onClick={() =>
                  onDelete?.(entry)
                }
              >
                {deleting
                  ? deleteLabel || t("common.delete")
                  : t("common.delete")}
              </button>
            )}
          </div>
        )}

        {!admin &&
          canDelete && (
            <div className="archive-card-actions">
              <button
              type="button"
              disabled={
                disableActions
              }
              onClick={() =>
                onDelete?.(entry)
              }
            >
              {deleting
                ? deleteLabel || t("common.delete")
                : t("common.delete")}
            </button>
          </div>
        )}
      </article>

      {isOpen && (
        <div
          className="archive-modal-backdrop"
          role="presentation"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <article
            className="archive-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              entry.title
            }
          >
            <div className="archive-modal-head">
              <div>
                <p className="eyebrow">
                  {t(`archive.types.${toValueKey(entry.type)}`) !== `archive.types.${toValueKey(entry.type)}`
                    ? t(`archive.types.${toValueKey(entry.type)}`)
                    : formatLabel(entry.type)}
                </p>

                <h2>
                  <TranslateButton
                    text={entry.title || ""}
                    sourceLanguage="en"
                    contentKey={`archive:${entry.id || entry.title || "entry"}:title`}
                    className="translate-block"
                    as="span"
                    showControls={false}
                  />
                </h2>

                <p className="muted">
                  {entry.entry_date}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
              >
                {t("common.close")}
              </button>
            </div>

            {isVideo &&
              embedUrl && (
                <div className="archive-modal-video">
                  <iframe
                    src={embedUrl}
                    title={
                      entry.title ||
                      t("archive.videoTitle")
                    }
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

            {isVideo &&
              !embedUrl &&
              entry.url && (
                <p>
                  <a
                    href={
                      entry.url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("common.openVideo")}
                  </a>
                </p>
              )}

            {entry.body && (
              <div className="archive-modal-body">
                <TranslateButton
                  text={entry.body}
                  sourceLanguage="en"
                  contentKey={`archive:${entry.id || entry.title || "entry"}:body`}
                  showStatusAbove
                  statusLabel="translate.articleTranslating"
                  className="translate-block"
                />
              </div>
            )}

            {entry.url &&
              !isVideo && (
                <div className="archive-modal-link">
                  <a
                    href={
                      entry.url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("common.openExternalLink")}
                  </a>
                </div>
              )}

            <section className="archive-modal-attachments">
              <h3>
                {t(
                  "common.attachments"
                )}
              </h3>

              {!attachments.length && (
                <p className="muted">
                  {t(
                    "common.noAttachments"
                  )}
                </p>
              )}

              {attachments.map(
                (attachment) => {
                  const attachmentId =
                    String(
                      attachment.id ||
                        ""
                    );
                  const isImage =
                    isImageAttachment(
                      attachment
                    );

                  return (
                    <article
                      className="archive-attachment-item"
                      key={
                        attachment.id
                      }
                    >
                      {isImage ? (
                        attachmentUrls[
                          attachmentId
                        ] ? (
                          <img
                            src={
                              attachmentUrls[
                                attachmentId
                              ]
                            }
                            alt={
                              attachment.original_filename
                            }
                            className="archive-attachment-image"
                          />
                        ) : (
                          <button
                            type="button"
                            className="archive-attachment-preview-load"
                            onClick={() =>
                              loadImagePreview(
                                attachment
                              )
                            }
                          >
                            {t(
                              "common.image"
                            )}
                          </button>
                        )
                      ) : (
                        <div className="archive-attachment-file-badge">
                          {t(
                            getAttachmentTypeLabelKey(
                              attachment.attachment_type
                            )
                          )}
                        </div>
                      )}

                      <div className="archive-attachment-meta">
                        <p className="archive-attachment-name">
                          {
                            attachment.original_filename
                          }
                        </p>

                        <p className="muted archive-attachment-detail">
                          {t(
                            getAttachmentTypeLabelKey(
                              attachment.attachment_type
                            )
                          )}
                          {" · "}
                          {formatAttachmentSize(
                            attachment.size_bytes
                          )}
                        </p>
                      </div>

                      <div className="archive-attachment-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openAttachment(
                              attachment
                            )
                          }
                          disabled={
                            loadingAttachmentId ===
                            attachmentId
                          }
                        >
                          {t(
                            "common.open"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openAttachment(
                              attachment,
                              {
                                download: true,
                              }
                            )
                          }
                          disabled={
                            loadingAttachmentId ===
                            attachmentId
                          }
                        >
                          {t(
                            "common.download"
                          )}
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </section>

            {tags.length > 0 && (
              <div className="tag-list archive-modal-tags">
                {tags.map(
                  (
                    tag,
                    index
                  ) => (
                    <span
                      className="tag"
                      key={`${tag}-${index}`}
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            )}
          </article>
        </div>
      )}
    </>
  );
}
