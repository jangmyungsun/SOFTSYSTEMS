"use client";

import {
  useEffect,
  useState,
} from "react";

import { useLanguage } from "./LanguageProvider";
import {
  ARCHIVE_ATTACHMENT_MAX_FILES,
  formatAttachmentSize,
  getAttachmentTypeLabelKey,
  isImageAttachment,
  validateArchiveAttachmentFile,
} from "../lib/archiveAttachments";

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
  initialAttachments = [],
  onSubmit,
  onCancel,
  submitting = false,
  allowAttachments = true,
}) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const [
    form,
    setForm,
  ] = useState(() =>
    prepareInitialForm(
      initial
    )
  );

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

  const [
    existingAttachments,
    setExistingAttachments,
  ] = useState([]);

  const [
    removedAttachmentIds,
    setRemovedAttachmentIds,
  ] = useState([]);

  useEffect(() => {
    setForm(
      prepareInitialForm(
        initial
      )
    );
  }, [initial]);

  useEffect(() => {
    setExistingAttachments(
      Array.isArray(initialAttachments)
        ? initialAttachments
        : []
    );

    setRemovedAttachmentIds([]);

    setSelectedFiles((previous) => {
      previous.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(
            item.previewUrl
          );
        }
      });

      return [];
    });
  }, [initialAttachments]);

  useEffect(
    () => () => {
      selectedFiles.forEach(
        (item) => {
          if (item.previewUrl) {
            URL.revokeObjectURL(
              item.previewUrl
            );
          }
        }
      );
    },
    [selectedFiles]
  );

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

  const removeSelectedFile = (
    removeId
  ) => {
    setSelectedFiles(
      (previous) => {
        const target =
          previous.find(
            (item) =>
              item.id ===
              removeId
          );

        if (target?.previewUrl) {
          URL.revokeObjectURL(
            target.previewUrl
          );
        }

        return previous.filter(
          (item) =>
            item.id !==
            removeId
        );
      }
    );
  };

  const removeExistingAttachment = (
    attachmentId
  ) => {
    if (!attachmentId) {
      return;
    }

    setRemovedAttachmentIds(
      (previous) =>
        previous.includes(
          attachmentId
        )
          ? previous
          : [
              ...previous,
              attachmentId,
            ]
    );

    setExistingAttachments(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !==
            attachmentId
        )
    );
  };

  const handleFileSelection = (
    event
  ) => {
    if (!allowAttachments) {
      return;
    }

    const incomingFiles =
      Array.from(
        event?.target
          ?.files || []
      );

    if (!incomingFiles.length) {
      return;
    }

    const nextItems = [];
    const activeExistingCount =
      existingAttachments.length;
    const currentCount =
      activeExistingCount +
      selectedFiles.length;
    const availableSlots =
      Math.max(
        0,
        ARCHIVE_ATTACHMENT_MAX_FILES -
          currentCount
      );

    if (availableSlots <= 0) {
      window.alert(
        t(
          "archiveForm.maximumFilesReached"
        )
      );

      event.target.value =
        "";

      return;
    }

    for (
      let index = 0;
      index < incomingFiles.length;
      index += 1
    ) {
      const file =
        incomingFiles[index];
      const validation =
        validateArchiveAttachmentFile(
          file
        );

      if (!validation.ok) {
        window.alert(
          t(
            validation.errorKey
          )
        );

        continue;
      }

      if (
        nextItems.length >=
        availableSlots
      ) {
        window.alert(
          t(
            "archiveForm.maximumFilesReached"
          )
        );

        break;
      }

      const previewUrl =
        validation.attachmentType ===
        "image"
          ? URL.createObjectURL(
              file
            )
          : "";

      nextItems.push({
        id:
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        previewUrl,
        attachmentType:
          validation.attachmentType,
      });
    }

    if (nextItems.length) {
      setSelectedFiles(
        (previous) => [
          ...previous,
          ...nextItems,
        ]
      );
    }

    event.target.value =
      "";
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
        t("archiveForm.titleRequired")
      );

      return;
    }

    if (
      form.type !==
        "video" &&
      !body
    ) {
      window.alert(
        t("archiveForm.bodyRequired")
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
        t("archiveForm.videoRequired")
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

      selectedFiles:
        selectedFiles.map(
          (item) =>
            item.file
        ),

      removeAttachmentIds:
        removedAttachmentIds,
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
          {t("common.archiveEntry")}
        </p>

        <h2>
          {initial
            ? t("common.editArchive")
            : t("common.newArchive")}
        </h2>

        <p className="subtitle">
          {t("archiveForm.subtitle")}
        </p>
      </section>

      <section className="form-section">
        <h3>{t("common.type")}</h3>

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
                    {t(`archive.types.${item.value.replace(/-/g, "_")}`)}
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
            {t("common.date")}

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
            {t("common.title")}

            <input
              type="text"
              placeholder={t("common.archiveTitle")}
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
            ? t("common.descriptionOrTranscript")
            : t("common.bodyLabel")}

          <textarea
            rows={14}
            placeholder={
              form.type ===
              "essay"
                ? t("archiveForm.placeholders.essay")
                : form.type ===
                  "reflection"
                ? t("archiveForm.placeholders.reflection")
                : form.type ===
                  "project-log"
                ? t("archiveForm.placeholders.project_log")
                : form.type ===
                  "video"
                ? t("archiveForm.placeholders.video")
                : t("archiveForm.placeholders.reference")
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
          {t("common.url")}

          <input
            type="url"
            placeholder={
              form.type ===
              "video"
                ? t("archiveForm.videoUrl")
                : t("archiveForm.externalUrl")
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

      {allowAttachments && (
        <section className="form-section">
          <h3>{t("common.attachments")}</h3>

          <p className="muted attachment-subtitle">
            {t(
              "archiveForm.addImagesOrBookFiles"
            )}
          </p>

          <p className="muted attachment-help">
            {t(
              "archiveForm.acceptedFileTypes"
            )}
          </p>

          <label className="attachment-picker">
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.epub,.txt,.doc,.docx,image/jpeg,image/png,image/webp,image/gif,application/pdf,application/epub+zip,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={
                handleFileSelection
              }
              disabled={
                submitting
              }
            />
          </label>

          <div className="attachment-list-wrap">
            <p className="muted attachment-list-title">
              {t(
                "archiveForm.selectedFiles"
              )}
            </p>

            {existingAttachments.length ===
              0 &&
              selectedFiles.length ===
                0 && (
                <p className="muted">
                  {t(
                    "common.noAttachments"
                  )}
                </p>
              )}

            {existingAttachments.length >
              0 &&
              existingAttachments.map(
                (
                  attachment
                ) => (
                  <div
                    className="attachment-item"
                    key={
                      attachment.id
                    }
                  >
                    {isImageAttachment(
                      attachment
                    ) ? (
                      <div className="attachment-thumbnail attachment-thumbnail-placeholder">
                        {t(
                          "common.image"
                        )}
                      </div>
                    ) : (
                      <div className="attachment-thumbnail attachment-thumbnail-placeholder">
                        {t(
                          getAttachmentTypeLabelKey(
                            attachment.attachment_type
                          )
                        )}
                      </div>
                    )}

                    <div className="attachment-meta">
                      <p className="attachment-name">
                        {
                          attachment.original_filename
                        }
                      </p>

                      <p className="muted attachment-detail">
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

                    <button
                      type="button"
                      onClick={() =>
                        removeExistingAttachment(
                          attachment.id
                        )
                      }
                      disabled={
                        submitting
                      }
                    >
                      {t(
                        "common.remove"
                      )}
                    </button>
                  </div>
                )
              )}

            {selectedFiles.map(
              (item) => (
                <div
                  className="attachment-item"
                  key={
                    item.id
                  }
                >
                  {item.previewUrl ? (
                    <img
                      className="attachment-thumbnail"
                      src={
                        item.previewUrl
                      }
                      alt={
                        item.file.name
                      }
                    />
                  ) : (
                    <div className="attachment-thumbnail attachment-thumbnail-placeholder">
                      {t(
                        getAttachmentTypeLabelKey(
                          item.attachmentType
                        )
                      )}
                    </div>
                  )}

                  <div className="attachment-meta">
                    <p className="attachment-name">
                      {
                        item.file
                          .name
                      }
                    </p>

                    <p className="muted attachment-detail">
                      {t(
                        getAttachmentTypeLabelKey(
                          item.attachmentType
                        )
                      )}
                      {" · "}
                      {formatAttachmentSize(
                        item.file
                          .size
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeSelectedFile(
                        item.id
                      )
                    }
                    disabled={
                      submitting
                    }
                  >
                    {t(
                      "common.remove"
                    )}
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      )}

      <section className="form-section">
        <label>
          {t("common.tags")}

          <input
            type="text"
            placeholder={t("archiveForm.tagsPlaceholder")}
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
          {t("archiveForm.tagsHelp")}
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
            {t("common.publicArchive")}
          </span>
        </label>

        <p className="muted">
          {t("common.publicArchiveHelp")}
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
            ? t("common.saving")
            : initial
            ? t("common.updateArchive")
            : t("common.saveArchive")}
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
            {t("common.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
