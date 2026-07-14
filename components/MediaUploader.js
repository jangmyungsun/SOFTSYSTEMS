"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BUCKET_NAME = "softsystems-media";

function safeFileName(fileName) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");
}

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
  media = [],
  onChange,
}) {
  const [uploading, setUploading] =
    useState(false);

  const uploadFiles = async (event) => {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) {
      return;
    }

    setUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "You must be logged in to upload files."
        );
      }

      const uploadedItems = [];

      for (const file of files) {
        const cleanName = safeFileName(
          file.name
        );

        const uniqueName =
          `${Date.now()}-${crypto.randomUUID()}-${cleanName}`;

        const filePath =
          `${session.user.id}/${uniqueName}`;

        const { error } = await supabase
          .storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (error) {
          throw error;
        }

        uploadedItems.push({
          bucket: BUCKET_NAME,
          path: filePath,
          name: file.name,
          type: getMediaType(file),
          mime_type: file.type,
          size: file.size,
        });
      }

      onChange([
        ...media,
        ...uploadedItems,
      ]);
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "File upload failed."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeItem = async (item) => {
    const confirmed = window.confirm(
      `Delete ${item.name}?`
    );

    if (!confirmed) {
      return;
    }

    if (item.path) {
      const { error } = await supabase
        .storage
        .from(
          item.bucket || BUCKET_NAME
        )
        .remove([item.path]);

      if (error) {
        alert(error.message);
        return;
      }
    }

    onChange(
      media.filter(
        (current) =>
          current.path !== item.path
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
          onChange={uploadFiles}
          disabled={uploading}
        />
      </label>

      <p className="muted">
        MP3, WAV, JPG, PNG, MOV, MP4,
        and PDF
      </p>

      {uploading && (
        <p>Uploading…</p>
      )}

      {media.length > 0 && (
        <div className="media-list">
          {media.map(
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
                    removeItem(item)
                  }
                >
                  Remove
                </button>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
