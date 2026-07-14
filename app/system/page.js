"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabaseClient";

import {
  getEcosystemPatterns,
  buildWeave,
  getHomeState,
} from "../../lib/utils";

function currentMonth(items) {
  const now = new Date();

  return items.filter(
    (item) => {
      const date =
        new Date(item.date);

      return (
        date.getMonth() ===
          now.getMonth() &&
        date.getFullYear() ===
          now.getFullYear()
      );
    }
  );
}

function downloadFile(
  name,
  content,
  type = "application/json"
) {
  const blob =
    new Blob(
      [content],
      {
        type,
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
  link.download = name;
  link.click();

  URL.revokeObjectURL(
    url
  );
}

export default function SystemPage() {
  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    videos,
    setVideos,
  ] = useState([]);

  const [
    session,
    setSession,
  ] = useState(null);

  const [
    reading,
    setReading,
  ] = useState(null);

  const [
    periodDays,
    setPeriodDays,
  ] = useState(30);

  const [
    status,
    setStatus,
  ] = useState("idle");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: sessionData,
      } =
        await supabase.auth.getSession();

      setSession(
        sessionData.session
      );

      const {
        data: logRows,
        error: logError,
      } = await supabase
        .from("field_logs")
        .select("*")
        .eq(
          "is_public",
          true
        )
        .order("date", {
          ascending: true,
        });

      if (logError) {
        console.error(
          logError
        );
      }

      setLogs(
        logRows || []
      );

      const {
        data: videoRows,
        error: videoError,
      } = await supabase
        .from(
          "video_archive"
        )
        .select("*")
        .eq(
          "is_public",
          true
        )
        .order("date", {
          ascending: true,
        });

      if (videoError) {
        console.error(
          videoError
        );
      }

      setVideos(
        videoRows || []
      );
    }

    load();
  }, []);

  const monthLogs =
    useMemo(
      () =>
        currentMonth(logs),
      [logs]
    );

  const monthVideos =
    useMemo(
      () =>
        currentMonth(videos),
      [videos]
    );

  const homeState =
    getHomeState(
      monthLogs
    );

  const patterns =
    getEcosystemPatterns(
      logs
    );

  const associations =
    buildWeave(logs)
      .edges
      .slice(0, 8);

  const fallbackReflection =
    monthLogs.length
      ? `This month moved in a ${homeState.mode.toLowerCase()} mode. ${homeState.bodyWeather} body weather met a ${homeState.energyTone.toLowerCase()} energy tone.`
      : "This month has not gathered enough material yet.";

  const reflection =
    reading?.overview ||
    fallbackReflection;

  const storyboard = {
    title:
      `SOFTSYSTEMS — ${
        new Date()
          .toLocaleString(
            "en-US",
            {
              month:
                "long",

              year:
                "numeric",
            }
          )
      }`,

    generated_at:
      new Date()
        .toISOString(),

    system_reading:
      reading,

    scenes: [
      ...monthLogs.map(
        (log) => ({
          type:
            "daily",

          date:
            log.date,

          weather:
            log.environment
              ?.weather ||
            log.state
              ?.weather ||
            "",

          energy:
            log.state
              ?.energy ||
            "",

          body_state:
            log.state
              ?.body_state ||
            "",

          observation:
            log.observation ||
            "",

          ai_analysis:
            log.ai_analysis ||
            {},

          media:
            log.media ||
            [],
        })
      ),

      ...monthVideos.map(
        (video) => ({
          type:
            "video",

          title:
            video.title,

          url:
            video.youtube_url,
        })
      ),

      {
        type:
          "reflection",

        text:
          reflection,
      },
    ],
  };

  const generateReading =
    async () => {
      if (!session) {
        setErrorMessage(
          "Please log in first."
        );

        return;
      }

      setStatus(
        "loading"
      );

      setErrorMessage("");

      try {
        const response =
          await fetch(
            "/api/system",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${session.access_token}`,
              },

              body:
                JSON.stringify({
                  days:
                    periodDays,
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
            "System reading failed."
          );
        }

        setReading(
          result.reading
        );

        setStatus(
          "ready"
        );
      } catch (error) {
        console.error(
          error
        );

        setErrorMessage(
          error.message ||
          "System reading failed."
        );

        setStatus(
          "error"
        );
      }
    };

  return (
    <>
      <section className="panel">
        <p className="eyebrow">
          System
        </p>

        <h2>
          Period Reading
        </h2>

        <p className="subtitle">
          AI reads several Daily
          records together to identify
          recurring signals, shifts,
          and relationships.
        </p>

        <div className="actions">
          <label>
            Period

            <select
              value={
                periodDays
              }
              onChange={(
                event
              ) =>
                setPeriodDays(
                  Number(
                    event
                      .target
                      .value
                  )
                )
              }
            >
              <option value={7}>
                Recent 7 days
              </option>

              <option value={30}>
                Recent 30 days
              </option>

              <option value={90}>
                Recent 90 days
              </option>
            </select>
          </label>

          <button
            className="primary"
            type="button"
            onClick={
              generateReading
            }
            disabled={
              status ===
              "loading"
            }
          >
            {status ===
            "loading"
              ? "Reading…"
              : "Generate AI Reading"}
          </button>
        </div>

        {errorMessage && (
          <p className="muted">
            {errorMessage}
          </p>
        )}
      </section>

      {reading && (
        <>
          <section className="panel">
            <p className="label">
              Current Mode
            </p>

            <div className="big">
              {
                reading.current_mode
              }
            </div>

            <p>
              {reading.overview}
            </p>

            <p className="muted">
              {
                reading.confidence_note
              }
            </p>
          </section>

          <section className="grid two">
            <div className="panel">
              <h2>
                Recurring Signals
              </h2>

              {reading
                .recurring_signals
                ?.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      className="entry"
                      key={`${item.signal}-${index}`}
                    >
                      <p>
                        {
                          item.signal
                        }
                      </p>

                      <p className="muted">
                        {
                          item.evidence
                        }
                      </p>
                    </div>
                  )
                )}
            </div>

            <div className="panel">
              <h2>
                Shifts
              </h2>

              {reading.shifts
                ?.map(
                  (
                    item,
                    index
                  ) => (
                    <p
                      key={`${item}-${index}`}
                    >
                      {item}
                    </p>
                  )
                )}
            </div>
          </section>

          <section className="panel">
            <h2>
              Relationships
            </h2>

            {reading
              .relationships
              ?.map(
                (
                  item,
                  index
                ) => (
                  <div
                    className="entry"
                    key={`${item.source}-${item.target}-${index}`}
                  >
                    <p>
                      {
                        item.source
                      }
                      {" → "}
                      {
                        item.target
                      }
                    </p>

                    <p className="muted">
                      {
                        item.observation
                      }
                    </p>
                  </div>
                )
              )}
          </section>

          <section className="panel">
            <p className="label">
              Open Question
            </p>

            <div className="big">
              {
                reading.open_question
              }
            </div>
          </section>
        </>
      )}

      <section className="panel">
        <h2>
          Rule-Based Patterns
        </h2>

        <p className="muted">
          These are calculated
          locally and do not use AI.
        </p>

        {patterns.map(
          (pattern) => (
            <p key={pattern}>
              {pattern}
            </p>
          )
        )}
      </section>

      <section className="panel">
        <h2>
          Associations
        </h2>

        <p className="muted">
          These are current
          co-occurrence connections.
          Semantic Weave will replace
          them in the next step.
        </p>

        {associations.map(
          (edge) => (
            <p
              key={
                edge.source +
                edge.target
              }
            >
              {
                edge.source
                  .split(":")[1]
              }
              {" → "}
              {
                edge.target
                  .split(":")[1]
              }

              <span className="muted">
                {" "}
                ({edge.weight})
              </span>
            </p>
          )
        )}
      </section>

      <section className="panel">
        <h2>
          Monthly Reflection
        </h2>

        <p>
          {reflection}
        </p>

        <div className="actions">
          <button
            type="button"
            onClick={() =>
              downloadFile(
                "SOFTSYSTEMS_monthly_reflection.txt",
                reflection,
                "text/plain"
              )
            }
          >
            Export Reflection
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>
          Monthly Film
        </h2>

        <p className="muted">
          Exports Daily records,
          media references, videos,
          and the current System
          reading as a structured
          storyboard.
        </p>

        <div className="actions">
          <button
            className="primary"
            type="button"
            onClick={() =>
              downloadFile(
                "SOFTSYSTEMS_monthly_storyboard.json",
                JSON.stringify(
                  storyboard,
                  null,
                  2
                )
              )
            }
          >
            Export Storyboard
          </button>
        </div>
      </section>
    </>
  );
}
