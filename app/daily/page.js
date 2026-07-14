"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabaseClient";

import {
  getCurrentWeather,
} from "../../lib/weather";

import EntryCard from "../../components/EntryCard";
import LogForm from "../../components/LogForm";
import MediaUploader from "../../components/MediaUploader";
import VideoForm from "../../components/VideoForm";
import VideoCard from "../../components/VideoCard";

const BUCKET_NAME =
  "softsystems-media";

function safeFileName(fileName) {
  return String(fileName || "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");
}

function getMediaType(file) {
  if (
    file.type.startsWith("image/")
  ) {
    return "image";
  }

  if (
    file.type.startsWith("audio/")
  ) {
    return "audio";
  }

  if (
    file.type.startsWith("video/")
  ) {
    return "video";
  }

  if (
    file.type ===
    "application/pdf"
  ) {
    return "pdf";
  }

  return "file";
}

export default function DailyPage() {
  const [
    session,
    setSession,
  ] = useState(null);

  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    videos,
    setVideos,
  ] = useState([]);

  const [
    editing,
    setEditing,
  ] = useState(null);

  /*
   * 아직 Supabase Storage에
   * 업로드하지 않은 파일.
   */
  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

  /*
   * 이미 Storage와 Daily 기록에
   * 연결되어 있는 파일.
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

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saveStatus,
    setSaveStatus,
  ] = useState("");

  /*
   * 로그인 상태와 기존 데이터를
   * Supabase에서 불러온다.
   */
  const load = async () => {
    const {
      data: {
        session: currentSession,
      },
    } =
      await supabase.auth.getSession();

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
      console.error(
        "Daily load error:",
        logError
      );

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
      console.error(
        "Video load error:",
        videoError
      );
    }

    setVideos(videoRows || []);
  };

  /*
   * 현재 위치를 바탕으로
   * 날씨 데이터를 자동 수집한다.
   */
  const collectWeather =
    async () => {
      setWeatherStatus(
        "loading"
      );

      try {
        const weather =
          await getCurrentWeather();

        setEnvironment(weather);

        setWeatherStatus(
          "success"
        );
      } catch (error) {
        console.error(
          "Weather error:",
          error
        );

        setEnvironment(null);

        setWeatherStatus(
          "error"
        );
      }
    };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    collectWeather();
  }, []);

  /*
   * Save Daily를 누른 시점에
   * 선택된 파일들을 업로드한다.
   */
  const uploadSelectedFiles =
    async () => {
      if (
        !selectedFiles.length
      ) {
        return [];
      }

      if (!session) {
        throw new Error(
          "You must be logged in."
        );
      }

      const uploadedItems = [];

      for (
        const item of selectedFiles
      ) {
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
              cacheControl:
                "3600",

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
          bucket:
            BUCKET_NAME,

          path:
            filePath,

          name:
            file.name,

          type:
            getMediaType(file),

          mime_type:
            file.type,

          size:
            file.size,

          uploaded_at:
            new Date()
              .toISOString(),
        });
      }

      return uploadedItems;
    };

  /*
   * 저장된 Daily를
   * /api/analyze 서버 Route로 보내
   * AI 분석을 생성한다.
   */
  const analyzeDaily = async (
    logId,
    logPayload
  ) => {
    const {
      data: sessionData,
    } =
      await supabase.auth.getSession();

    const accessToken =
      sessionData?.session
        ?.access_token;

    if (!accessToken) {
      throw new Error(
        "No login session was found."
      );
    }

    const response =
      await fetch(
        "/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body:
            JSON.stringify({
              log: logPayload,
            }),
        }
      );

    let result;

    try {
      result =
        await response.json();
    } catch {
      throw new Error(
        "The AI server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "AI analysis failed."
      );
    }

    if (!result?.analysis) {
      throw new Error(
        "The AI returned no analysis."
      );
    }

    const {
      error: updateError,
    } = await supabase
      .from("field_logs")
      .update({
        ai_analysis:
          result.analysis,
      })
      .eq("id", logId);

    if (updateError) {
      throw updateError;
    }

    return result.analysis;
  };

  /*
   * 파일 업로드 → Daily 저장
   * → AI 분석 → 화면 갱신
   */
  const saveLog = async (
    payload
  ) => {
    if (!session) {
      alert(
        "Please log in first."
      );

      return;
    }

    let newlyUploadedMedia = [];

    try {
      setSaving(true);

      setSaveStatus(
        selectedFiles.length
          ? "Uploading files…"
          : "Saving Daily…"
      );

      newlyUploadedMedia =
        await uploadSelectedFiles();

      const finalMedia = [
        ...existingMedia,
        ...newlyUploadedMedia,
      ];

      const finalPayload = {
        ...payload,

        /*
         * 자동 수집된 날씨를
         * environment 컬럼에 저장.
         */
        environment:
          environment ||
          editing?.environment ||
          {},

        /*
         * 기존 파일과 새 파일을
         * 함께 Daily 기록에 연결.
         */
        media:
          finalMedia,

        /*
         * 모든 Daily는 기본 Public.
         */
        is_public:
          true,
      };

      let savedLogId;

      setSaveStatus(
        "Saving Daily…"
      );

      if (editing) {
        const {
          error: updateError,
        } = await supabase
          .from("field_logs")
          .update(finalPayload)
          .eq(
            "id",
            editing.id
          );

        if (updateError) {
          throw updateError;
        }

        savedLogId =
          editing.id;
      } else {
        const {
          data: insertedLog,
          error: insertError,
        } = await supabase
          .from("field_logs")
          .insert({
            ...finalPayload,

            user_id:
              session.user.id,
          })
          .select("id")
          .single();

        if (insertError) {
          throw insertError;
        }

        if (!insertedLog?.id) {
          throw new Error(
            "The saved Daily ID was not returned."
          );
        }

        savedLogId =
          insertedLog.id;
      }

      /*
       * Daily 저장은 완료됐으므로
       * 이후 AI가 실패해도 기록은 유지한다.
       */
      setSaveStatus(
        "Reading the Daily with AI…"
      );

      try {
        await analyzeDaily(
          savedLogId,
          finalPayload
        );

        setSaveStatus(
          "Daily and AI reading saved."
        );
      } catch (
        analysisError
      ) {
        console.error(
          "AI analysis error:",
          analysisError
        );

        setSaveStatus(
          "Daily saved. AI reading could not be completed."
        );

        alert(
          `Daily was saved, but AI analysis failed: ${
            analysisError.message
          }`
        );
      }

      setEditing(null);

      setSelectedFiles([]);

      setExistingMedia([]);

      await load();

      await collectWeather();

      alert(
        "Daily saved."
      );
    } catch (error) {
      console.error(
        "Daily save error:",
        error
      );

      /*
       * 파일 업로드는 성공했지만
       * Daily DB 저장이 실패한 경우,
       * 방금 업로드한 파일을 삭제한다.
       */
      const rollbackPaths =
        newlyUploadedMedia
          .map(
            (item) =>
              item.path
          )
          .filter(Boolean);

      if (
        rollbackPaths.length
      ) {
        const {
          error:
            rollbackError,
        } = await supabase
          .storage
          .from(BUCKET_NAME)
          .remove(
            rollbackPaths
          );

        if (
          rollbackError
        ) {
          console.error(
            "Rollback error:",
            rollbackError
          );
        }
      }

      setSaveStatus(
        "Daily could not be saved."
      );

      alert(
        error.message ||
          "Daily could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * 기존 Daily 수정 시작.
   */
  const startEditing = (
    log
  ) => {
    setEditing(log);

    setSelectedFiles([]);

    setExistingMedia(
      Array.isArray(
        log.media
      )
        ? log.media
        : []
    );

    setEnvironment(
      log.environment ||
        null
    );

    setSaveStatus("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEditing = () => {
    setEditing(null);

    setSelectedFiles([]);

    setExistingMedia([]);

    setSaveStatus("");

    collectWeather();
  };

  /*
   * 수정 화면에서 기존 파일을
   * 다음 저장 대상에서 제외한다.
   */
  const removeExistingMedia =
    async (item) => {
      const confirmed =
        window.confirm(
          `Remove ${item.name}?`
        );

      if (!confirmed) {
        return;
      }

      setExistingMedia(
        (current) =>
          current.filter(
            (mediaItem) =>
              mediaItem.path !==
              item.path
          )
      );
    };

  const toggleLog = async (
    log
  ) => {
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

  /*
   * Daily와 연결된 Storage 파일을
   * 먼저 지운 뒤 DB 기록을 삭제.
   */
  const deleteLog = async (
    log
  ) => {
    const confirmed =
      window.confirm(
        "Delete this Daily entry?"
      );

    if (!confirmed) {
      return;
    }

    const paths = (
      Array.isArray(
        log.media
      )
        ? log.media
        : []
    )
      .map(
        (item) =>
          item.path
      )
      .filter(Boolean);

    if (paths.length) {
      const {
        error: storageError,
      } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove(paths);

      if (storageError) {
        console.error(
          "Storage deletion error:",
          storageError
        );

        alert(
          `Media deletion warning: ${
            storageError.message
          }`
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
      alert(
        "Please log in first."
      );

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

  const toggleVideo =
    async (video) => {
      const {
        error,
      } = await supabase
        .from(
          "video_archive"
        )
        .update({
          is_public:
            !video.is_public,
        })
        .eq(
          "id",
          video.id
        );

      if (error) {
        alert(error.message);
        return;
      }

      await load();
    };

  const deleteVideo =
    async (video) => {
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
        .from(
          "video_archive"
        )
        .delete()
        .eq(
          "id",
          video.id
        );

      if (error) {
        alert(error.message);
        return;
      }

      await load();
    };

  const exportAll = () => {
    const blob =
      new Blob(
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
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "SOFTSYSTEMS_archive.json";

    link.click();

    URL.revokeObjectURL(
      url
    );
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
              disabled={saving}
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
              Collecting
              weather…
            </p>
          )}

          {weatherStatus ===
            "error" && (
            <>
              <p className="muted">
                Weather could not
                be collected.
                Check your browser
                location
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
                {
                  environment.wind
                }
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

        {saveStatus && (
          <p className="muted">
            {saveStatus}
          </p>
        )}
      </section>

      <section className="panel">
        <h2>
          Archive Video
        </h2>

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
            Export Full
            Archive JSON
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>
          Daily Archive
        </h2>

        {logs.map(
          (log) => (
            <EntryCard
              key={log.id}
              log={log}
              admin
              onEdit={
                startEditing
              }
              onDelete={
                deleteLog
              }
              onToggle={
                toggleLog
              }
            />
          )
        )}

        {!logs.length && (
          <p className="muted">
            No Daily entries yet.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>
          Video Archive
        </h2>

        <div className="video-grid">
          {videos.map(
            (video) => (
              <VideoCard
                key={
                  video.id
                }
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
