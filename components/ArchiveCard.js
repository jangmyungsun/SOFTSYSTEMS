"use client";

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
  const text = String(
    value || ""
  )
    .replace(/\s+/g, " ")
    .trim();

  if (
    text.length <= maxLength
  ) {
    return text;
  }

  return (
    text.slice(
      0,
      maxLength
    ) + "…"
  );
}

function getYoutubeVideoId(url) {
  if (!url) {
    return "";
  }

  try {
    if (
      url.includes(
        "youtu.be/"
      )
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

function getYoutubeThumbnail(
  url
) {
  const videoId =
    getYoutubeVideoId(url);

  if (!videoId) {
    return "";
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export default function ArchiveCard({
  entry,
  admin = false,
  onEdit,
  onDelete,
  onToggle,
}) {
  const tags =
    getSafeArray(
      entry.tags
    );

  const isVideo =
    entry.type === "video";

  const thumbnail =
    isVideo
      ? getYoutubeThumbnail(
          entry.url
        )
      : "";

  const openEntry = () => {
    if (
      isVideo &&
      entry.url
    ) {
      window.open(
        entry.url,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <article
      className={
        isVideo
          ? "archive-preview-card archive-video-card"
          : "archive-preview-card archive-text-card"
      }
    >
      <button
        type="button"
        className="archive-preview-main"
        onClick={
          openEntry
        }
        disabled={
          !isVideo ||
          !entry.url
        }
        aria-label={
          isVideo
            ? `Open ${entry.title}`
            : entry.title
        }
      >
        {isVideo ? (
          <>
            {thumbnail ? (
              <img
                className="archive-preview-image"
                src={
                  thumbnail
                }
                alt=""
              />
            ) : (
              <div className="archive-preview-placeholder">
                Video
              </div>
            )}

            <div className="archive-video-shade" />

            <div className="archive-video-content">
              <p className="eyebrow">
                Video
              </p>

              <h2>
                {
                  entry.title
                }
              </h2>

              <p className="muted">
                {
                  entry.entry_date
                }
              </p>
            </div>
          </>
        ) : (
          <div className="archive-text-content">
            <div>
              <p className="eyebrow">
                {formatLabel(
                  entry.type
                )}
              </p>

              <h2>
                {
                  entry.title
                }
              </h2>

              <p className="muted">
                {
                  entry.entry_date
                }
              </p>
            </div>

            <p className="archive-preview-excerpt">
              {shortenText(
                entry.body,
                190
              ) ||
                "No preview text."}
            </p>

            {tags.length >
              0 && (
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
          </div>
        )}
      </button>

      {admin && (
        <div className="archive-card-actions">
          <button
            type="button"
            onClick={() =>
              onEdit?.(
                entry
              )
            }
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() =>
              onToggle?.(
                entry
              )
            }
          >
            {entry.is_public
              ? "Private"
              : "Public"}
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete?.(
                entry
              )
            }
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
