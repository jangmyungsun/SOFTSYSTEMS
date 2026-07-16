"use client";

import { useLanguage } from "./LanguageProvider";

function getMediaType(file) {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type === "application/pdf") {
    return "pdf";
  }

  return "file";
}

function translateMediaType(t, value) {
  const key = `media.types.${String(value || "file").toLowerCase()}`;
  const translated = t(key);

  return translated === key ? t("media.types.file") : translated;
}

export default function MediaUploader({
  selectedFiles = [],
  existingMedia = [],
  onFilesChange,
  onRemoveExisting,
}) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const selectFiles = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) {
      return;
    }

    const newItems = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      type: getMediaType(file),
      mime_type: file.type,
      size: file.size,
    }));

    onFilesChange([
      ...selectedFiles,
      ...newItems,
    ]);

    event.target.value = "";
  };

  const removeSelected = (id) => {
    onFilesChange(
      selectedFiles.filter(
        (item) => item.id !== id
      )
    );
  };

  return (
    <section className="block">
      <p className="block-title">
        {t("media.collection")}
      </p>

      <label>
        {t("media.addFiles")}
        <input
          type="file"
          multiple
          accept="
            audio/mpeg,
            audio/wav,
            audio/x-wav,
            image/jpeg,
            image/png,
            video/quicktime,
            video/mp4,
            application/pdf
          "
          onChange={selectFiles}
        />
      </label>

      <p className="muted">
        {t("media.uploadHelp")}
      </p>

      {existingMedia.length > 0 && (
        <div className="media-list">
          <p className="block-title">
            {t("media.savedFiles")}
          </p>

          {existingMedia.map(
            (item, index) => (
              <div
                className="media-item"
                key={
                  item.id ||
                  item.storage_path ||
                  item.path ||
                  `${item.original_filename || item.name}-${index}`
                }
              >
                <div>
                  <p>
                    {translateMediaType(
                      t,
                      item.kind || item.type
                    )} —{" "}
                    {item.original_filename || item.name}
                  </p>

                  {(item.size_bytes || item.size) && (
                    <p className="muted">
                      {(
                        (item.size_bytes || item.size) /
                        1024 /
                        1024
                      ).toFixed(2)}
                      MB
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onRemoveExisting(item)
                  }
                >
                  {t("media.remove")}
                </button>
              </div>
            )
          )}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="media-list">
          <p className="block-title">
            {t("media.waitingToUpload")}
          </p>

          {selectedFiles.map((item) => (
            <div
              className="media-item"
              key={item.id}
            >
              <div>
                <p>
                  {translateMediaType(
                    t,
                    item.type
                  )} — {item.name}
                </p>

                <p className="muted">
                  {(
                    item.size /
                    1024 /
                    1024
                  ).toFixed(2)}
                  MB
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  removeSelected(item.id)
                }
              >
                {t("media.remove")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
