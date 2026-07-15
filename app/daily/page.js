"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabaseClient";

import {
  getWeatherForDate,
} from "../../lib/weather";

import EntryCard from "../../components/EntryCard";
import LogForm from "../../components/LogForm";
import MediaUploader from "../../components/MediaUploader";

const BUCKET_NAME =
  "softsystems-media";

function getTodayString() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

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
    editing,
    setEditing,
  ] = useState(null);

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

  const [
    existingMedia,
    setExistingMedia,
  ] = useState([]);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayString()
  );

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
   * 로그인 상태와 기존 Daily 기록 불러오기
   */
  const load = async () => {
    const {
      data: {
        session:
          currentSession,
      },
    } =
      await supabase.auth.getSession();

    setSession(
      currentSession
    );

    if (!currentSession) {
      setLogs([]);
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

      alert(
        logError.message
      );
    }

    setLogs(
      rows || []
    );
  };

  /*
   * 선택 날짜의 날씨 자동 수집
   */
  const collectWeather =
    async (
      date =
        selectedDate
    ) => {
      if (!date) {
        return;
      }

      setWeatherStatus(
        "loading"
      );

      try {
        const weather =
          await getWeatherForDate(
            date
          );

        setEnvironment(
          weather
        );

        setWeatherStatus(
          "success"
        );
      } catch (error) {
        console.error(
          "Weather error:",
          error
        );

        setEnvironment(
          null
        );

        setWeatherStatus(
          "error"
        );
      }
    };

  /*
   * LogForm의 Date가 바뀌면
   * 선택 날짜와 날씨를 함께 변경
   */
  const handleDateChange =
    async (date) => {
      if (!date) {
        return;
      }

      setSelectedDate(
        date
      );

      setEnvironment(
        null
      );

      await collectWeather(
        date
      );
    };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    collectWeather(
      selectedDate
    );
  }, []);

  /*
   * 선택된 파일을 Supabase Storage에 업로드
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
        const file =
          item.file;

        if (!file) {
          continue;
        }

        const cleanName =
          safeFileName(
            file.name
          );

        const uniqueName =
          `${Date.now()}-` +
          `${crypto.randomUUID()}-` +
          cleanName;

        const dateFolder =
          selectedDate ||
          getTodayString();

        const filePath =
          `${session.user.id}/` +
          `${dateFolder}/` +
          uniqueName;

        const {
          error: uploadError,
        } = await supabase
          .storage
          .from(
            BUCKET_NAME
          )
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "3600",

              upsert:
                false,

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
            getMediaType(
              file
            ),

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
   * Daily 기록을 AI 분석 API로 전달
   */
  const analyzeDaily =
    async (
      logId,
      logPayload
    ) => {
      const {
        data:
          sessionData,
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
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                log:
                  logPayload,
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

      if (
        !result?.analysis
      ) {
        throw new Error(
          "The AI returned no analysis."
        );
      }

      const {
        error:
          updateError,
      } = await supabase
        .from("field_logs")
        .update({
          ai_analysis:
            result.analysis,
        })
        .eq(
          "id",
          logId
        );

      if (updateError) {
        throw updateError;
      }

      return result.analysis;
    };

  /*
   * 파일 업로드
   * → Daily 저장
   * → AI 분석
   * → 화면 갱신
   */
  const saveLog =
    async (
      payload
    ) => {
      if (!session) {
        alert(
          "Please log in first."
        );

        return;
      }

      let newlyUploadedMedia =
        [];

      try {
        setSaving(
          true
        );

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

        const finalDate =
          payload.date ||
          selectedDate ||
          getTodayString();

        /*
         * 날씨가 선택 날짜와 다르면
         * 저장 전에 다시 수집한다.
         */
        let finalEnvironment =
          environment;

        if (
          !finalEnvironment ||
          finalEnvironment.date !==
            finalDate
        ) {
          setSaveStatus(
            "Collecting weather for the selected date…"
          );

          try {
            finalEnvironment =
              await getWeatherForDate(
                finalDate
              );

            setEnvironment(
              finalEnvironment
            );
          } catch (
            weatherError
          ) {
            console.error(
              "Weather save error:",
              weatherError
            );

            /*
             * 편집 중이고 기존 환경값이 있으면
             * 기존 값을 보존한다.
             */
            finalEnvironment =
              editing?.environment ||
              {};
          }
        }

        const finalPayload = {
          ...payload,

          date:
            finalDate,

          environment:
            finalEnvironment ||
            {},

          media:
            finalMedia,

          is_public:
            true,
        };

        let savedLogId;

        setSaveStatus(
          "Saving Daily…"
        );

        if (editing) {
          const {
            error:
              updateError,
          } = await supabase
            .from(
              "field_logs"
            )
            .update(
              finalPayload
            )
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
            data:
              insertedLog,
            error:
              insertError,
          } = await supabase
            .from(
              "field_logs"
            )
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

          if (
            !insertedLog?.id
          ) {
            throw new Error(
              "The saved Daily ID was not returned."
            );
          }

          savedLogId =
            insertedLog.id;
        }

        /*
         * Daily DB 저장은 이미 완료됨.
         * AI 분석 실패 시에도 Daily는 유지됨.
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

        const today =
          getTodayString();

        setEditing(
          null
        );

        setSelectedFiles(
          []
        );

        setExistingMedia(
          []
        );

        setSelectedDate(
          today
        );

        await load();

        await collectWeather(
          today
        );

        alert(
          "Daily saved."
        );
      } catch (error) {
        console.error(
          "Daily save error:",
          error
        );

        /*
         * Storage 업로드 후
         * Daily 저장 실패 시 업로드 롤백
         */
        const rollbackPaths =
          newlyUploadedMedia
            .map(
              (item) =>
                item.path
            )
            .filter(
              Boolean
            );

        if (
          rollbackPaths.length
        ) {
          const {
            error:
              rollbackError,
          } = await supabase
            .storage
            .from(
              BUCKET_NAME
            )
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
          error?.message ||
            "Daily could not be saved."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /*
   * 기존 Daily 편집
   */
  const startEditing =
    (log) => {
      setEditing(
        log
      );

      setSelectedDate(
        log.date ||
          getTodayString()
      );

      setSelectedFiles(
        []
      );

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

      setWeatherStatus(
        log.environment
          ? "success"
          : "idle"
      );

      setSaveStatus(
        ""
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  /*
   * 편집 취소 시 오늘 날짜와
   * 오늘 날씨로 복귀
   */
  const cancelEditing =
    async () => {
      const today =
        getTodayString();

      setEditing(
        null
      );

      setSelectedFiles(
        []
      );

      setExistingMedia(
        []
      );

      setSelectedDate(
        today
      );

      setSaveStatus(
        ""
      );

      await collectWeather(
        today
      );
    };

  /*
   * 편집 화면에서 기존 미디어 제외
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
            (
              mediaItem
            ) =>
              mediaItem.path !==
              item.path
          )
      );
    };

  const toggleLog =
    async (log) => {
      const {
        error,
      } = await supabase
        .from(
          "field_logs"
        )
        .update({
          is_public:
            !log.is_public,
        })
        .eq(
          "id",
          log.id
        );

      if (error) {
        alert(
          error.message
        );

        return;
      }

      await load();
    };

  /*
   * Daily 삭제 시 연결된 Storage 파일도 삭제
   */
  const deleteLog =
    async (log) => {
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
        .filter(
          Boolean
        );

      if (
        paths.length
      ) {
        const {
          error:
            storageError,
        } = await supabase
          .storage
          .from(
            BUCKET_NAME
          )
          .remove(
            paths
          );

        if (
          storageError
        ) {
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
        .from(
          "field_logs"
        )
        .delete()
        .eq(
          "id",
          log.id
        );

      if (error) {
        alert(
          error.message
        );

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

    link.href =
      url;

    link.download =
      "SOFTSYSTEMS_daily_archive.json";

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
              disabled={
                saving
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

          <p className="muted">
            Weather for{" "}
            {selectedDate}
          </p>

          {weatherStatus ===
            "loading" && (
            <p>
              Collecting weather
              for the selected
              date…
            </p>
          )}

          {weatherStatus ===
            "error" && (
            <>
              <p className="muted">
                Weather could not
                be collected.
                Check your browser
                location permission.
              </p>

              <button
                type="button"
                onClick={() =>
                  collectWeather(
                    selectedDate
                  )
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

              {environment.temperature_max !==
                null &&
                environment.temperature_max !==
                  undefined && (
                  <p>
                    High —{" "}
                    {
                      environment.temperature_max
                    }
                    {
                      environment.units
                        ?.temperature
                    }
                  </p>
                )}

              {environment.temperature_min !==
                null &&
                environment.temperature_min !==
                  undefined && (
                  <p>
                    Low —{" "}
                    {
                      environment.temperature_min
                    }
                    {
                      environment.units
                        ?.temperature
                    }
                  </p>
                )}

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

              {environment.source && (
                <p className="muted">
                  Source —{" "}
                  {
                    environment.source
                  }
                </p>
              )}
            </div>
          )}
        </section>

        <LogForm
          key={
            editing?.id ||
            "new-daily"
          }
          initial={
            editing
          }
          onSubmit={
            saveLog
          }
          onDateChange={
            handleDateChange
          }
        />

        <h2>
          Collection
        </h2>

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
        <div className="actions">
          <button
            type="button"
            onClick={
              exportAll
            }
          >
            Export Daily JSON
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
              key={
                log.id
              }
              log={
                log
              }
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
    </>
  );
}
