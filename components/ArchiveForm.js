"use client";

import {
  useEffect,
  useState,
} from "react";

const ARCHIVE_TYPES = [
  {
    value: "essay",
    label: "Essay",
  },
  {
    value: "reflection",
    label: "Reflection",
  },
  {
    value: "project-log",
    label: "Project Log",
  },
  {
    value: "video",
    label: "Video",
  },
  {
    value: "reference",
    label: "Reference",
  },
];

function getTodayString() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function getSafeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function tagsToText(tags) {
  return getSafeArray(tags)
    .join(", ");
}

function textToTags(text) {
  return String(text || "")
    .split(",")
    .map((item) =>
      item.trim()
    )
    .filter(Boolean)
    .filter(
      (
        item,
        index,
        array
      ) =>
        array.indexOf(item) ===
        index
    );
}

function makeEmptyForm() {
  return {
    type: "reflection",
    title: "",
    entry_date:
      getTodayString(),
    body: "",
    url: "",
    tags_text: "",
    is_public: true,
  };
}

function prepareInitialForm(
  initial
) {
  if (!initial) {
    return makeEmptyForm();
  }

  return {
    ...makeEmptyForm(),
    ...initial,

    entry_date:
      initial.entry_date ||
      initial.date ||
      getTodayString(),

    tags_text:
      tagsToText(
        initial.tags
      ),

    is_public:
      initial.is_public !==
      false,
  };
}

export default function ArchiveForm({
  initial,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [
    form,
    setForm,
  ] = useState(() =>
    prepareInitialForm(
      initial
    )
  );

  useEffect(() => {
    setForm(
      prepareInitialForm(
        initial
      )
    );
  }, [initial]);

  const updateField = (
    key,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
  };

  const selectType = (
    type
  ) => {
    updateField(
      "type",
      type
    );
  };

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    const title =
      form.title.trim();

    const body =
      form.body.trim();

    const url =
      form.url.trim();

    const tags =
      textToTags(
        form.tags_text
      );

    if (!title) {
      window.alert(
        "Please enter a title."
      );

      return;
    }

    if (
      form.type !==
        "video" &&
      !body
    ) {
      window.alert(
        "Please enter the archive text."
      );

      return;
    }

    if (
      form.type ===
        "video" &&
      !url &&
      !body
    ) {
      window.alert(
        "Please enter a video URL or description."
      );

      return;
    }

    onSubmit?.({
      type:
        form.type,

      title,

      entry_date:
        form.entry_date,

      body,

      url,

      tags,

      is_public:
        Boolean(
          form.is_public
        ),
    });
  };

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >
      <section className="form-section">
        <p className="eyebrow">
          Archive Entry
        </p>

        <h2>
          {initial
            ? "Edit Archive"
            : "New Archive"}
        </h2>

        <p className="subtitle">
          Store writing,
          reflections, project
          records, videos, and
          references in one
          archive.
        </p>
      </section>

      <section className="form-section">
        <h3>Type</h3>

        <div className="artistic-type-list">
          {ARCHIVE_TYPES.map(
            (item) => {
              const checked =
                form.type ===
                item.value;

              return (
                <label
                  className={
                    checked
                      ? "artistic-type selected"
                      : "artistic-type"
                  }
                  key={
                    item.value
                  }
                >
                  <input
                    type="radio"
                    name="archive-type"
                    value={
                      item.value
                    }
                    checked={
                      checked
                    }
                    onChange={() =>
                      selectType(
                        item.value
                      )
                    }
                  />

                  <span>
                    {item.label}
                  </span>
                </label>
              );
            }
          )}
        </div>
      </section>

      <section className="form-section">
        <div className="grid two">
          <label>
            Date

            <input
              type="date"
              value={
                form.entry_date
              }
              onChange={(
                event
              ) =>
                updateField(
                  "entry_date",
                  event.target
                    .value
                )
              }
              required
            />
          </label>

          <label>
            Title

            <input
              type="text"
              placeholder="Archive title"
              value={
                form.title
              }
              onChange={(
                event
              ) =>
                updateField(
                  "title",
                  event.target
                    .value
                )
              }
              required
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <label>
          {form.type ===
          "video"
            ? "Description or Transcript"
            : "Body"}

          <textarea
            rows={14}
            placeholder={
              form.type ===
              "essay"
                ? "Write the full essay here."
                : form.type ===
                  "reflection"
                ? "Write the thought or reflection you want to preserve."
                : form.type ===
                  "project-log"
                ? "Record the project process, decisions, questions, or changes."
                : form.type ===
                  "video"
                ? "Add a description, transcript, or notes about the video."
                : "Record the reference and why it matters."
            }
            value={
              form.body
            }
            onChange={(
              event
            ) =>
              updateField(
                "body",
                event.target
                  .value
              )
            }
          />
        </label>
      </section>

      <section className="form-section">
        <label>
          URL

          <input
            type="url"
            placeholder={
              form.type ===
              "video"
                ? "YouTube or Vimeo URL"
                : "Optional external link"
            }
            value={
              form.url
            }
            onChange={(
              event
            ) =>
              updateField(
                "url",
                event.target
                  .value
              )
            }
          />
        </label>
      </section>

      <section className="form-section">
        <label>
          Tags

          <input
            type="text"
            placeholder="care, maintenance, body, sound"
            value={
              form.tags_text
            }
            onChange={(
              event
            ) =>
              updateField(
                "tags_text",
                event.target
                  .value
              )
            }
          />
        </label>

        <p className="muted">
          Separate tags with
          commas.
        </p>
      </section>

      <section className="form-section">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={
              form.is_public
            }
            onChange={(
              event
            ) =>
              updateField(
                "is_public",
                event.target
                  .checked
              )
            }
          />

          <span>
            Public Archive
          </span>
        </label>

        <p className="muted">
          Public entries can be
          shown on the Archive
          page. Private entries
          remain visible only to
          the signed-in owner.
        </p>
      </section>

      <div className="actions">
        <button
          className="primary"
          type="submit"
          disabled={
            submitting
          }
        >
          {submitting
            ? "Saving…"
            : initial
            ? "Update Archive"
            : "Save Archive"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={
              onCancel
            }
            disabled={
              submitting
            }
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
