"use client";

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

export default function MediaUploader({
  selectedFiles = [],
  existingMedia = [],
  onFilesChange,
  onRemoveExisting,
}) {
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
        Collection
      </p>

      <label>
        Add files
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
        Files will upload when you press
        Save Daily.
      </p>

      {existingMedia.length > 0 && (
        <div className="media-list">
          <p className="block-title">
            Saved Files
          </p>

          {existingMedia.map(
            (item, index) => (
              <div
                className="media-item"
                key={
                  item.path ||
                  `${item.name}-${index}`
                }
              >
                <div>
                  <p>
                    {item.type || "file"} —{" "}
                    {item.name}
                  </p>

                  {item.size && (
                    <p className="muted">
                      {(
                        item.size /
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
                  Remove
                </button>
              </div>
            )
          )}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="media-list">
          <p className="block-title">
            Waiting to Upload
          </p>

          {selectedFiles.map((item) => (
            <div
              className="media-item"
              key={item.id}
            >
              <div>
                <p>
                  {item.type} — {item.name}
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
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
