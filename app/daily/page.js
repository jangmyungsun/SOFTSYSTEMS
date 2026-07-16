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
import {
  getAttachmentKind,
  isAllowedAttachmentFile,
  normalizeFileName,
} from "../../lib/dailyAttachments";

import EntryCard from "../../components/EntryCard";
import LogForm from "../../components/LogForm";
import MediaUploader from "../../components/MediaUploader";
import { useLanguage } from "../../components/LanguageProvider";

const BUCKET_NAME =
  "daily-collection";

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

function normalizeAttachment(item) {
  if (!item) {
    return null;
  }

  if (item.id && item.storage_path) {
    return {
      id: item.id,
      daily_id: item.daily_id,
      storage_bucket: item.storage_bucket || BUCKET_NAME,
      storage_path: item.storage_path,
      original_filename: item.original_filename || item.name || "file",
      mime_type: item.mime_type || item.type || "",
      size_bytes: Number(item.size_bytes || item.size || 0),
      created_at: item.created_at || item.uploaded_at || new Date().toISOString(),
      uploaded_by: item.uploaded_by || item.user_id || null,
      is_public: item.is_public !== false,
      kind: item.kind || getAttachmentKind({
        type: item.mime_type || item.type || "",
        name: item.original_filename || item.name || "",
      }),
    };
  }

  if (item.path) {
    return {
      id: item.id || item.path,
      daily_id: item.daily_id || null,
      storage_bucket: item.bucket || BUCKET_NAME,
      storage_path: item.path,
      original_filename: item.name || "file",
      mime_type: item.mime_type || "",
      size_bytes: Number(item.size || 0),
      created_at: item.uploaded_at || new Date().toISOString(),
      uploaded_by: item.uploaded_by || null,
      is_public: item.is_public !== false,
      kind: item.type || getAttachmentKind({
        type: item.mime_type || item.type || "",
        name: item.name || "",
      }),
    };
  }

  return null;
}

async function fetchAttachmentsByDailyId(logs) {
  const dailyIds = Array.isArray(logs)
    ? logs.map((log) => log.id).filter(Boolean)
    : [];

  if (!dailyIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("daily_attachments")
    .select(
      `
        id,
        daily_id,
        storage_bucket,
        storage_path,
        original_filename,
        mime_type,
        size_bytes,
        created_at,
        uploaded_by,
        is_public
      `
    )
    .in("daily_id", dailyIds);

  if (error) {
    throw error;
  }

  const attachmentsByDailyId = new Map();

  (data || []).forEach((attachment) => {
    const normalized = normalizeAttachment(attachment);

    if (!normalized?.daily_id) {
      return;
    }

    const current = attachmentsByDailyId.get(normalized.daily_id) || [];
    current.push(normalized);
    attachmentsByDailyId.set(normalized.daily_id, current);
  });

  return attachmentsByDailyId;
}

export default function DailyPage() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const locale =
    language?.locale || "en";

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
    attachmentLoadError,
    setAttachmentLoadError,
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
        setAttachmentLoadError("");

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

        let attachmentsByDailyId = new Map();

        try {
          attachmentsByDailyId = await fetchAttachmentsByDailyId(data || []);
          setAttachmentLoadError("");
        } catch (attachmentError) {
          console.error(
            "Daily attachment load error:",
            attachmentError
          );

          setAttachmentLoadError(
            attachmentError?.message ||
              "Attachment metadata could not be loaded."
          );
        }

        setLogs(
          (data || []).map((log) => ({
            ...log,
            daily_attachments:
              attachmentsByDailyId.get(log.id) || [],
          }))
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

        if (!isAllowedAttachmentFile(file)) {
          throw new Error(
            `Unsupported file type: ${file.name}`
          );
        }

        const cleanName =
          normalizeFileName(file.name) ||
          safeFileName(file.name);

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
          uploadError.failedFile = file.name;
          uploadError.uploadedItems = uploadedItems.slice();
          throw uploadError;
        }

        uploadedItems.push({
          bucket:
            BUCKET_NAME,

          path:
            filePath,

          original_filename:
            file.name,

          kind:
            getAttachmentKind({
              type: file.type,
              name: file.name,
            }),

          mime_type:
            file.type,

          size_bytes:
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

              "x-softsystems-locale":
                locale,

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                locale,

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
      let attachmentIssue = null;
      let savedDailyRecord = null;

      try {
        setSaving(true);

        setSaveStatus(
          "Saving Daily…"
        );


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

        savedDailyRecord = {
          ...finalPayload,
          id: savedLogId,
          user_id: session.user.id,
          date: finalDate,
          environment: finalEnvironment || {},
        };

        if (selectedFiles.length) {
          setSaveStatus(
            "Uploading attachments…"
          );

          try {
            newlyUploadedMedia = await uploadSelectedFiles();

            if (newlyUploadedMedia.length) {
              const attachmentRows = newlyUploadedMedia.map((item) => ({
                daily_id: savedLogId,
                storage_bucket: item.bucket,
                storage_path: item.path,
                original_filename: item.original_filename,
                mime_type: item.mime_type,
                size_bytes: item.size_bytes,
                uploaded_by: session.user.id,
                is_public: Boolean(finalPayload.is_public),
              }));

              const { error: attachmentError } = await supabase
                .from("daily_attachments")
                .insert(attachmentRows);

              if (attachmentError) {
                throw attachmentError;
              }
            }
          } catch (error) {
            attachmentIssue = error;

            const rollbackPaths = newlyUploadedMedia
              .map((item) => item.path)
              .filter(Boolean);

            if (rollbackPaths.length) {
              const { error: rollbackError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove(rollbackPaths);

              if (rollbackError) {
                console.error("Attachment rollback error:", rollbackError);
              }
            }

            console.error("Attachment upload error:", error);
          }
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

        if (!attachmentIssue) {
          setEditing(null);
          setSelectedFiles([]);
          setExistingMedia([]);
          setSelectedDate(today);
          setSaveStatus("");

          await loadLogs(session);
          await collectWeather(today);

          window.alert("Daily saved.");
        } else {
          setEditing(savedDailyRecord);
          setSaveStatus(
            `Daily was saved, but attachment upload failed for ${
              attachmentIssue?.failedFile || "one file"
            }.`
          );

          window.alert(
            `Daily was saved, but attachment upload failed for ${
              attachmentIssue?.failedFile || "one file"
            }: ${attachmentIssue?.message || "Attachment upload failed."}`
          );

          await loadLogs(session);
        }
      } catch (error) {
        console.error(
          "Daily save error:",
          error
        );

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
        Array.isArray(log.daily_attachments)
          ? log.daily_attachments.map(normalizeAttachment).filter(Boolean)
          : Array.isArray(log.media)
            ? log.media.map(normalizeAttachment).filter(Boolean)
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
          `Remove ${item.original_filename || item.name}?`
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
              mediaItem.id !==
              item.id
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

      const attachments = Array.isArray(log.daily_attachments)
        ? log.daily_attachments
        : Array.isArray(log.media)
          ? log.media
          : [];

      const storagePaths = attachments
        .map((item) => item.storage_path || item.path)
        .filter(Boolean);

      if (storagePaths.length) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(storagePaths);

        if (storageError) {
          console.error("Storage deletion error:", storageError);

          window.alert(`Attachment deletion warning: ${storageError.message}`);
        }
      }

      const attachmentIds = attachments
        .map((item) => item.id)
        .filter(Boolean);

      if (attachmentIds.length) {
        const { error: attachmentError } = await supabase
          .from("daily_attachments")
          .delete()
          .in("id", attachmentIds);

        if (attachmentError) {
          console.error("Attachment row deletion error:", attachmentError);
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
            {t("daily.loading")}
          </p>
        </section>
      )}

      {!authLoading &&
        session && (
          <section className="panel">
            <div className="entry-head">
              <div>
                <p className="eyebrow">
                  {t("common.daily")}
                </p>

                <h2>
                  {editing
                    ? t("daily.editDaily")
                    : t("daily.newDaily")}
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
                  {t("daily.cancelEdit")}
                </button>
              )}
            </div>

            <section className="block">
              <p className="block-title">
                {t("common.environment")}
              </p>

              <p className="muted">
                {t("daily.weatherFor")} {selectedDate}
              </p>

              {weatherStatus ===
                "loading" && (
                <p>
                  {t("daily.collectingWeather")}
                </p>
              )}

              {weatherStatus ===
                "error" && (
                <>
                  <p className="muted">
                    {t("daily.weatherError")}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      collectWeather(
                        selectedDate
                      )
                    }
                  >
                    {t("daily.tryAgain")}
                  </button>
                </>
              )}

              {environment && (
                <div className="grid three">
                  <p>
                    {t("common.weather")} —{" "}
                    {
                      environment
                        .weather
                    }
                  </p>

                  <p>
                    {t("common.temperature")} —{" "}
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
                        {t("daily.high")} —{" "}
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
                        {t("daily.low")} —{" "}
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
                    {t("common.humidity")} —{" "}
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
                    {t("common.pressure")} —{" "}
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
                    {t("common.wind")} —{" "}
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
                    {t("common.sunrise")} —{" "}
                    {
                      environment
                        .sunrise
                    }
                  </p>

                  <p>
                    {t("common.sunset")} —{" "}
                    {
                      environment
                        .sunset
                    }
                  </p>

                  {environment
                    .source && (
                    <p className="muted">
                      {t("daily.source")} —{" "}
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
              {t("common.collection")}
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

            {attachmentLoadError && (
              <p className="muted">
                {attachmentLoadError}
              </p>
            )}

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
              {t("common.daily")}
            </p>

            <h2>
              {t("daily.publicTitle")}
            </h2>

            <p className="subtitle">
              {t("daily.publicSubtitle")}
            </p>

            <p className="muted">
              {t("daily.signInPrompt")}
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
                {t("daily.exportJson")}
              </button>
            </div>
          </section>
        )}

      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              {t("input.title")}
            </p>

            <h2>
              {t("daily.archiveTitle")}
            </h2>
          </div>

          <span className="badge">
            {logs.length} {logs.length === 1
              ? t("daily.record")
              : t("daily.records")}
          </span>
        </div>

        {logsLoading && (
          <p className="muted">
            {t("daily.loadingRecords")}
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
              {t("daily.noEntries")}
            </p>
          )}
      </section>
    </>
  );
}
