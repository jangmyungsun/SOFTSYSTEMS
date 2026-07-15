"use client";

import {
  useCallback,
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
    file.type.startsWith(
      "image/"
    )
  ) {
    return "image";
  }

  if (
    file.type.startsWith(
      "audio/"
    )
  ) {
    return "audio";
  }

  if (
    file.type.startsWith(
      "video/"
    )
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
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    logsLoading,
    setLogsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

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
   * 로그인 여부에 따라 Daily를 다르게 불러온다.
   *
   * 로그인:
   * 본인이 작성한 공개·비공개 기록 전체
   *
   * 비로그인:
   * 공개 기록만
   */
  const loadLogs =
    useCallback(
      async (
        currentSession
      ) => {
        setLogsLoading(true);
        setLoadError("");

        let query =
          supabase
            .from(
              "field_logs"
            )
            .select("*")
            .order(
              "date",
              {
                ascending:
                  false,
              }
            );

        if (
          currentSession
            ?.user?.id
        ) {
          query =
            query.eq(
              "user_id",
              currentSession
                .user.id
            );
        } else {
          query =
            query.eq(
              "is_public",
              true
            );
        }

        const {
          data,
          error,
        } = await query;

        if (error) {
          console.error(
            "Daily load error:",
            error
          );

          setLogs([]);
          setLoadError(
            error.message
          );
          setLogsLoading(
            false
          );

          return;
        }

        setLogs(
          data || []
        );

        setLogsLoading(
          false
        );
      },
      []
    );

  /*
   * 초기 로그인 상태를 확인하고
   * 로그인 변화도 계속 반영한다.
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const {
        data,
        error,
      } =
        await supabase.auth
          .getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          "Daily auth error:",
          error
        );
      }

      const currentSession =
        data?.session ||
        null;

      setSession(
        currentSession
      );

      setAuthLoading(
        false
      );

      await loadLogs(
        currentSession
      );
    }

    initializeAuth();

    const {
      data:
        authListener,
    } =
      supabase.auth
        .onAuthStateChange(
          async (
            _event,
            nextSession
          ) => {
            if (!mounted) {
              return;
            }

            setSession(
              nextSession
            );

            setAuthLoading(
              false
            );

            setEditing(
              null
            );

            setSelectedFiles(
              []
            );

            setExistingMedia(
              []
            );

            await loadLogs(
              nextSession
            );
          }
        );

    return () => {
      mounted = false;

      authListener
        ?.subscription
        ?.unsubscribe();
    };
  }, [loadLogs]);

  /*
   * 로그인 상태가 확인된 뒤에만
   * 입력용 날씨를 수집한다.
   *
   * 비로그인 방문자는 공개 Daily만 보기 때문에
   * 브라우저 위치 권한을 요구하지 않는다.
   */
  useEffect(() => {
    if (
      authLoading ||
      !session
    ) {
      return;
    }

    collectWeather(
      selectedDate
    );
  }, [
    authLoading,
    session,
  ]);

  /*
   * 선택 날짜의 날씨 자동 수집
   */
  const collectWeather =
    async (
      date =
        selectedDate
    ) => {
      if (
        !date ||
        !session
      ) {
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
   * LogForm의 날짜가 바뀌면
   * 선택 날짜와 날씨를 함께 바꾼다.
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

  /*
   * 선택한 파일을 Supabase Storage에 업로드한다.
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

      const uploadedItems =
        [];

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
          error:
            uploadError,
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

        if (
          uploadError
        ) {
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
   * 저장된 Daily를 AI 분석 API에 전달한다.
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
        await supabase.auth
          .getSession();

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
        .from(
          "field_logs"
        )
        .update({
          ai_analysis:
            result.analysis,
        })
        .eq(
          "id",
          logId
        )
        .eq(
          "user_id",
          session.user.id
        );

      if (
        updateError
      ) {
        throw updateError;
      }

      return result.analysis;
    };

  /*
   * 파일 업로드
   * → Daily 저장
   * → AI 분석
   * → 목록 갱신
   */
  const saveLog =
    async (payload) => {
      if (!session) {
        window.alert(
          "Please log in first."
        );

        return;
      }

      let newlyUploadedMedia =
        [];

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

        const finalDate =
          payload.date ||
          selectedDate ||
          getTodayString();

        let finalEnvironment =
          environment;

        /*
         * 현재 날씨 데이터가 다른 날짜의 값이면
         * 선택 날짜 기준으로 다시 수집한다.
         */
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
             * 기존 Daily 편집 중이라면
             * 저장되어 있던 Environment를 보존한다.
             */
            finalEnvironment =
              editing
                ?.environment ||
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

          /*
           * 현재 LogForm은 공개 여부 입력이 없으므로
           * 새 Daily는 기본 공개로 저장한다.
           */
          is_public:
            payload.is_public !==
            false,
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
            )
            .eq(
              "user_id",
              session.user.id
            );

          if (
            updateError
          ) {
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
            .select(
              "id"
            )
            .single();

          if (
            insertError
          ) {
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
         * Daily 저장은 완료된 상태다.
         * AI 분석이 실패해도 Daily는 유지한다.
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

          window.alert(
            `Daily was saved, but AI analysis failed: ${
              analysisError
                .message
            }`
          );
        }

        const today =
          getTodayString();

        setEditing(null);
        setSelectedFiles([]);
        setExistingMedia([]);
        setSelectedDate(
          today
        );
        setSaveStatus("");

        await loadLogs(
          session
        );

        await collectWeather(
          today
        );

        window.alert(
          "Daily saved."
        );
      } catch (error) {
        console.error(
          "Daily save error:",
          error
        );

        /*
         * Storage 업로드 후 DB 저장이 실패하면
         * 이번 저장에서 새로 업로드한 파일만 되돌린다.
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

        window.alert(
          error?.message ||
            "Daily could not be saved."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * 기존 Daily 편집 시작
   */
  const startEditing =
    (log) => {
      if (!session) {
        return;
      }

      setEditing(log);

      setSelectedDate(
        log.date ||
          getTodayString()
      );

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

      setWeatherStatus(
        log.environment
          ? "success"
          : "idle"
      );

      setSaveStatus("");

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  /*
   * 편집 취소
   */
  const cancelEditing =
    async () => {
      const today =
        getTodayString();

      setEditing(null);
      setSelectedFiles([]);
      setExistingMedia([]);
      setSelectedDate(
        today
      );
      setSaveStatus("");

      await collectWeather(
        today
      );
    };

  /*
   * 편집 폼에서 기존 미디어를 제외한다.
   *
   * 이 단계에서는 Storage에서 즉시 삭제하지 않고,
   * 저장된 Daily의 media 배열에서만 제외한다.
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

  /*
   * 공개 / 비공개 전환
   */
  const toggleLog =
    async (log) => {
      if (!session) {
        return;
      }

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
        )
        .eq(
          "user_id",
          session.user.id
        );

      if (error) {
        window.alert(
          error.message
        );

        return;
      }

      await loadLogs(
        session
      );
    };

  /*
   * Daily 삭제 시 연결된 Storage 파일도 삭제한다.
   */
  const deleteLog =
    async (log) => {
      if (!session) {
        return;
      }

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
          error:
            storageError,
        } = await supabase
          .storage
          .from(
            BUCKET_NAME
          )
          .remove(paths);

        if (
          storageError
        ) {
          console.error(
            "Storage deletion error:",
            storageError
          );

          window.alert(
            `Media deletion warning: ${
              storageError
                .message
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
        )
        .eq(
          "user_id",
          session.user.id
        );

      if (error) {
        window.alert(
          error.message
        );

        return;
      }

      if (
        editing?.id ===
        log.id
      ) {
        await cancelEditing();
      }

      await loadLogs(
        session
      );
    };

  /*
   * 현재 사용자가 볼 수 있는 Daily 목록을 JSON으로 내보낸다.
   */
  const exportDaily =
    () => {
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

      link.href = url;

      link.download =
        "SOFTSYSTEMS_daily_archive.json";

      link.click();

      URL.revokeObjectURL(
        url
      );
    };

  return (
    <>
      {authLoading && (
        <section className="panel">
          <p className="muted">
            Loading Daily…
          </p>
        </section>
      )}

      {!authLoading &&
        session && (
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
                  Collecting
                  weather for the
                  selected date…
                </p>
              )}

              {weatherStatus ===
                "error" && (
                <>
                  <p className="muted">
                    Weather could
                    not be
                    collected.
                    Check your
                    browser location
                    permission.
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
                      environment
                        .weather
                    }
                  </p>

                  <p>
                    Temperature —{" "}
                    {
                      environment
                        .temperature
                    }
                    {
                      environment
                        .units
                        ?.temperature
                    }
                  </p>

                  {environment
                    .temperature_max !==
                    null &&
                    environment
                      .temperature_max !==
                      undefined && (
                      <p>
                        High —{" "}
                        {
                          environment
                            .temperature_max
                        }
                        {
                          environment
                            .units
                            ?.temperature
                        }
                      </p>
                    )}

                  {environment
                    .temperature_min !==
                    null &&
                    environment
                      .temperature_min !==
                      undefined && (
                      <p>
                        Low —{" "}
                        {
                          environment
                            .temperature_min
                        }
                        {
                          environment
                            .units
                            ?.temperature
                        }
                      </p>
                    )}

                  <p>
                    Humidity —{" "}
                    {
                      environment
                        .humidity
                    }
                    {
                      environment
                        .units
                        ?.humidity
                    }
                  </p>

                  <p>
                    Pressure —{" "}
                    {
                      environment
                        .pressure
                    }
                    {
                      environment
                        .units
                        ?.pressure
                    }
                  </p>

                  <p>
                    Wind —{" "}
                    {
                      environment
                        .wind
                    }
                    {
                      environment
                        .units
                        ?.wind
                    }
                  </p>

                  <p>
                    Sunrise —{" "}
                    {
                      environment
                        .sunrise
                    }
                  </p>

                  <p>
                    Sunset —{" "}
                    {
                      environment
                        .sunset
                    }
                  </p>

                  {environment
                    .source && (
                    <p className="muted">
                      Source —{" "}
                      {
                        environment
                          .source
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
        )}

      {!authLoading &&
        !session && (
          <section className="panel">
            <p className="eyebrow">
              Daily
            </p>

            <h2>
              Public Daily Records
            </h2>

            <p className="subtitle">
              Public observations
              of body, environment,
              Body Moving, making,
              learning, and
              artistic practice.
            </p>

            <p className="muted">
              Sign in to create
              or manage Daily
              entries.
            </p>
          </section>
        )}

      {!authLoading &&
        session && (
          <section className="panel">
            <div className="actions">
              <button
                type="button"
                onClick={
                  exportDaily
                }
              >
                Export Daily JSON
              </button>
            </div>
          </section>
        )}

      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              Input
            </p>

            <h2>
              Daily Archive
            </h2>
          </div>

          <span className="badge">
            {logs.length}{" "}
            {logs.length === 1
              ? "record"
              : "records"}
          </span>
        </div>

        {logsLoading && (
          <p className="muted">
            Loading Daily
            records…
          </p>
        )}

        {!logsLoading &&
          loadError && (
            <p className="muted">
              {loadError}
            </p>
          )}

        {!logsLoading &&
          !loadError &&
          logs.map(
            (log) => (
              <EntryCard
                key={log.id}
                log={log}
                admin={Boolean(
                  session &&
                    log.user_id ===
                      session.user.id
                )}
                onEdit={
                  session
                    ? startEditing
                    : undefined
                }
                onDelete={
                  session
                    ? deleteLog
                    : undefined
                }
                onToggle={
                  session
                    ? toggleLog
                    : undefined
                }
              />
            )
          )}

        {!logsLoading &&
          !loadError &&
          !logs.length && (
            <p className="muted">
              No public Daily
              entries yet.
            </p>
          )}
      </section>
    </>
  );
}
