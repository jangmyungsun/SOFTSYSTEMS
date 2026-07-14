"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabaseClient";
import { getCurrentWeather } from "../../lib/weather";

import EntryCard from "../../components/EntryCard";
import LogForm from "../../components/LogForm";
import MediaUploader from "../../components/MediaUploader";
import VideoForm from "../../components/VideoForm";
import VideoCard from "../../components/VideoCard";

const BUCKET_NAME = "softsystems-media";

function safeFileName(fileName) {
  return String(fileName || "")
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

export default function DailyPage() {
  const [session, setSession] =
    useState(null);

  const [logs, setLogs] =
    useState([]);

  const [videos, setVideos] =
    useState([]);

  const [editing, setEditing] =
    useState(null);

  /*
   * 아직 Storage에 업로드하지 않은 파일.
   * Save Daily를 누를 때 업로드된다.
   */
  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

  /*
   * 이미 Storage와 Daily 기록에 저장된 파일.
   */
  const [
    existingMedia,
    setExistingMedia,
  ] = useState([]);

  const [
    environment,
    setEnvironment,
  ] = useState(null);

  const [
    weatherStatus,
    setWeatherStatus,
  ] = useState("idle");

  const [saving, setSaving] =
    useState(false);

  const load = async () => {
    const {
      data: {
        session: currentSession,
      },
    } = await supabase.auth.getSession();

    setSession(currentSession);

    if (!currentSession) {
      setLogs([]);
      setVideos([]);
      return;
    }

    const {
      data: rows,
      error: logError,
    } = await supabase
      .from("field_logs")
      .select("*")
      .order("date", {
        ascending: false,
      });

    if (logError) {
      console.error(logError);
      alert(logError.message);
    }

    setLogs(rows || []);

    const {
      data: videoRows,
      error: videoError,
    } = await supabase
      .from("video_archive")
      .select("*")
      .order("date", {
        ascending: false,
      });

    if (videoError) {
      console.error(videoError);
    }

    setVideos(videoRows || []);
  };

  const collectWeather = async () => {
    setWeatherStatus("loading");

    try {
      const weather =
        await getCurrentWeather();

      setEnvironment(weather);
      setWeatherStatus("success");
    } catch (error) {
      console.error(error);

      setEnvironment(null);
      setWeatherStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    collectWeather();
  }, []);

  const uploadSelectedFiles =
    async () => {
      if (!selectedFiles.length) {
        return [];
      }

      if (!session) {
        throw new Error(
          "You must be logged in."
        );
      }

      const uploadedItems = [];

      for (const item of selectedFiles) {
        const file = item.file;

        if (!file) {
          continue;
        }

        const cleanName =
          safeFileName(file.name);

        const uniqueName =
          `${Date.now()}-` +
          `${crypto.randomUUID()}-` +
          cleanName;

        const dateFolder =
          new Date()
            .toISOString()
            .slice(0, 10);

        const filePath =
          `${session.user.id}/` +
          `${dateFolder}/` +
          uniqueName;

        const {
          error: uploadError,
        } = await supabase
          .storage
          .from(BUCKET_NAME)
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                file.type ||
                "application/octet-stream",
            }
          );

        if (uploadError) {
          throw uploadError;
        }

        uploadedItems.push({
          bucket: BUCKET_NAME,
          path: filePath,
          name: file.name,
          type: getMediaType(file),
          mime_type: file.type,
          size: file.size,
          uploaded_at:
            new Date().toISOString(),
        });
      }

      return uploadedItems;
    };

  const saveLog = async (payload) => {
    if (!session) {
      alert("Please log in first.");
      return;
    }

    let newlyUploadedMedia = [];

    try {
      setSaving(true);

      /*
       * Save Daily를 누르는 순간
       * 선택한 파일들을 Storage에 업로드.
       */
      newlyUploadedMedia =
        await uploadSelectedFiles();

      const finalMedia = [
        ...existingMedia,
        ...newlyUploadedMedia,
      ];

      const finalPayload = {
        ...payload,

        environment:
          environment ||
          editing?.environment ||
          {},

        media: finalMedia,
      };

      let result;

      if (editing) {
        result = await supabase
          .from("field_logs")
          .update(finalPayload)
          .eq("id", editing.id);
      } else {
        result = await supabase
          .from("field_logs")
          .insert({
            ...finalPayload,
            user_id:
              session.user.id,
          });
      }

      if (result.error) {
        throw result.error;
      }

      setEditing(null);
      setSelectedFiles([]);
      setExistingMedia([]);

      await load();
      await collectWeather();

      alert("Daily saved.");
    } catch (error) {
      console.error(error);

      /*
       * 파일은 올라갔는데 DB 저장이 실패한 경우,
       * 방금 올린 파일을 다시 삭제.
       */
      const rollbackPaths =
        newlyUploadedMedia
          .map(
            (item) => item.path
          )
          .filter(Boolean);

      if (rollbackPaths.length) {
        const {
          error: rollbackError,
        } = await supabase
          .storage
          .from(BUCKET_NAME)
          .remove(rollbackPaths);

        if (rollbackError) {
          console.error(
            rollbackError
          );
        }
      }

      alert(
        error.message ||
          "Daily could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (log) => {
    setEditing(log);

    setSelectedFiles([]);

    setExistingMedia(
      Array.isArray(log.media)
        ? log.media
        : []
    );

    setEnvironment(
      log.environment || null
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEditing = () => {
    setEditing(null);
    setSelectedFiles([]);
    setExistingMedia([]);
    collectWeather();
  };

  const removeExistingMedia =
    async (item) => {
      const confirmed =
        window.confirm(
          `Remove ${item.name}?`
        );

      if (!confirmed) {
        return;
      }

      /*
       * 여기서는 Storage에서 바로 삭제하지 않고
       * 화면과 다음 저장 payload에서만 제외한다.
       *
       * Save Daily를 누르기 전 취소할 가능성이 있으므로
       * 즉시 삭제하지 않는 편이 안전하다.
       */
      setExistingMedia(
        (current) =>
          current.filter(
            (mediaItem) =>
              mediaItem.path !==
              item.path
          )
      );
    };

  const toggleLog = async (log) => {
    const {
      error,
    } = await supabase
      .from("field_logs")
      .update({
        is_public:
          !log.is_public,
      })
      .eq("id", log.id);

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const deleteLog = async (log) => {
    const confirmed =
      window.confirm(
        "Delete this Daily entry?"
      );

    if (!confirmed) {
      return;
    }

    const paths = (
      Array.isArray(log.media)
        ? log.media
        : []
    )
      .map(
        (item) => item.path
      )
      .filter(Boolean);

    /*
     * Daily 기록 삭제 전에
     * 연결된 Storage 파일 삭제.
     */
    if (paths.length) {
      const {
        error: storageError,
      } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove(paths);

      if (storageError) {
        console.error(
          storageError
        );

        alert(
          `Media deletion warning: ${storageError.message}`
        );
      }
    }

    const {
      error,
    } = await supabase
      .from("field_logs")
      .delete()
      .eq("id", log.id);

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const saveVideo = async (
    payload
  ) => {
    if (!session) {
      alert("Please log in first.");
      return;
    }

    const {
      error,
    } = await supabase
      .from("video_archive")
      .insert({
        ...payload,
        user_id:
          session.user.id,
      });

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const toggleVideo = async (
    video
  ) => {
    const {
      error,
    } = await supabase
      .from("video_archive")
      .update({
        is_public:
          !video.is_public,
      })
      .eq("id", video.id);

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const deleteVideo = async (
    video
  ) => {
    const confirmed =
      window.confirm(
        "Delete this video record?"
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("video_archive")
      .delete()
      .eq("id", video.id);

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const exportAll = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            logs,
            videos,
          },
          null,
          2
        ),
      ],
      {
        type:
          "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "SOFTSYSTEMS_archive.json";

    link.click();

    URL.revokeObjectURL(url);
  };

  if (!session) {
    return (
      <section className="panel">
        <h2>Daily</h2>

        <p className="muted">
          Please log in first.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              Daily
            </p>

            <h2>
              {editing
                ? "Edit Daily"
                : "New Daily"}
            </h2>
          </div>

          {editing && (
            <button
              type="button"
              onClick={
                cancelEditing
              }
            >
              Cancel Edit
            </button>
          )}
        </div>

        <section className="block">
          <p className="block-title">
            Environment
          </p>

          {weatherStatus ===
            "loading" && (
            <p>
              Collecting weather…
            </p>
          )}

          {weatherStatus ===
            "error" && (
            <>
              <p className="muted">
                Weather could not be
                collected. Check your
                browser location
                permission.
              </p>

              <button
                type="button"
                onClick={
                  collectWeather
                }
              >
                Try Again
              </button>
            </>
          )}

          {environment && (
            <div className="grid three">
              <p>
                Weather —{" "}
                {
                  environment.weather
                }
              </p>

              <p>
                Temperature —{" "}
                {
                  environment.temperature
                }
                {
                  environment.units
                    ?.temperature
                }
              </p>

              <p>
                Humidity —{" "}
                {
                  environment.humidity
                }
                {
                  environment.units
                    ?.humidity
                }
              </p>

              <p>
                Pressure —{" "}
                {
                  environment.pressure
                }
                {
                  environment.units
                    ?.pressure
                }
              </p>

              <p>
                Wind —{" "}
                {environment.wind}
                {
                  environment.units
                    ?.wind
                }
              </p>

              <p>
                Sunrise —{" "}
                {
                  environment.sunrise
                }
              </p>

              <p>
                Sunset —{" "}
                {
                  environment.sunset
                }
              </p>
            </div>
          )}
        </section>

        <LogForm
          key={
            editing?.id ||
            "new-daily"
          }
          initial={editing}
          onSubmit={saveLog}
        />

        <h2>Collection</h2>

        <MediaUploader
          selectedFiles={
            selectedFiles
          }
          existingMedia={
            existingMedia
          }
          onFilesChange={
            setSelectedFiles
          }
          onRemoveExisting={
            removeExistingMedia
          }
        />

        {saving && (
          <p className="muted">
            Uploading files and
            saving Daily…
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Archive Video</h2>

        <VideoForm
          onSubmit={saveVideo}
        />
      </section>

      <section className="panel">
        <div className="actions">
          <button
            type="button"
            onClick={exportAll}
          >
            Export Full Archive JSON
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Daily Archive</h2>

        {logs.map((log) => (
          <EntryCard
            key={log.id}
            log={log}
            admin
            onEdit={startEditing}
            onDelete={deleteLog}
            onToggle={toggleLog}
          />
        ))}

        {!logs.length && (
          <p className="muted">
            No Daily entries yet.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Video Archive</h2>

        <div className="video-grid">
          {videos.map(
            (video) => (
              <VideoCard
                key={video.id}
                video={video}
                admin
                onToggle={
                  toggleVideo
                }
                onDelete={
                  deleteVideo
                }
              />
            )
          )}
        </div>

        {!videos.length && (
          <p className="muted">
            No videos yet.
          </p>
        )}
      </section>
    </>
  );
}
