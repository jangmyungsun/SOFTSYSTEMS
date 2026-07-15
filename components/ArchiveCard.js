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

function isVideoUrl(url) {
  return (
    typeof url === "string" &&
    (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com")
    )
  );
}

function getYoutubeEmbedUrl(url) {
  if (!url) {
    return "";
  }

  try {
    if (url.includes("youtu.be/")) {
      const id =
        url
          .split("youtu.be/")[1]
          ?.split(/[?&]/)[0];

      return id
        ? `https://www.youtube.com/embed/${id}`
        : "";
    }

    const parsed =
      new URL(url);

    if (
      parsed.hostname.includes(
        "youtube.com"
      )
    ) {
      const id =
        parsed.searchParams.get("v");

      return id
        ? `https://www.youtube.com/embed/${id}`
        : "";
    }
  } catch {
    return "";
  }

  return "";
}

export default function ArchiveCard({
  entry,
  admin = false,
  onEdit,
  onDelete,
  onToggle,
}) {
  const tags =
    getSafeArray(entry.tags);

  const embedUrl =
    entry.type === "video"
      ? getYoutubeEmbedUrl(
          entry.url
        )
      : "";

  return (
    <article className="entry">
      <div className="entry-head">
        <div>
          <p className="eyebrow">
            {formatLabel(
              entry.type
            )}
          </p>

          <h2>
            {entry.title}
          </h2>

          <p className="muted">
            {entry.entry_date}
          </p>
        </div>

        <div className="actions">
          <span className="badge">
            {entry.is_public
              ? "public"
              : "private"}
          </span>
        </div>
      </div>

      {embedUrl && (
        <div
          style={{
            marginTop:
              "1rem",
          }}
        >
          <iframe
            width="100%"
            height="420"
            src={embedUrl}
            title={
              entry.title ||
              "Archive video"
            }
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              border: 0,
              borderRadius:
                "12px",
            }}
          />
        </div>
      )}

      {entry.body && (
        <div
          className="block"
          style={{
            marginTop:
              "1rem",
          }}
        >
          <p
            style={{
              whiteSpace:
                "pre-wrap",
            }}
          >
            {entry.body}
          </p>
        </div>
      )}

      {entry.url &&
        !embedUrl && (
          <div
            className="block"
            style={{
              marginTop:
                "1rem",
            }}
          >
            <p className="block-title">
              Link
            </p>

            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer"
            >
              Open archive link
            </a>
          </div>
        )}

      {tags.length > 0 && (
        <div
          className="tag-list"
          style={{
            marginTop:
              "1rem",
          }}
        >
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

      {admin && (
        <div
          className="actions"
          style={{
            marginTop:
              "1.25rem",
          }}
        >
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
              ? "Make Private"
              : "Make Public"}
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
