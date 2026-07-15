"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  getHomeState,
} from "../lib/utils";

import EntryCard from "../components/EntryCard";
import VideoCard from "../components/VideoCard";

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return date.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

export default function Home() {
  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    videos,
    setVideos,
  ] = useState([]);

  const [
    guidance,
    setGuidance,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    async function loadHome() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [
          logsResult,
          videosResult,
          guidanceResult,
        ] = await Promise.all([
          supabase
            .from("field_logs")
            .select("*")
            .eq(
              "is_public",
              true
            )
            .order("date", {
              ascending: false,
            }),

          supabase
            .from("video_archive")
            .select("*")
            .eq(
              "is_public",
              true
            )
            .order("date", {
              ascending: false,
            }),

          supabase
            .from(
              "daily_guidance"
            )
            .select(
              `
                guidance_date,
                guidance,
                generated_at,
                is_public
              `
            )
            .eq(
              "is_public",
              true
            )
            .order(
              "guidance_date",
              {
                ascending: false,
              }
            )
            .limit(1)
            .maybeSingle(),
        ]);

        if (logsResult.error) {
          throw logsResult.error;
        }

        if (videosResult.error) {
          throw videosResult.error;
        }

        if (
          guidanceResult.error
        ) {
          throw guidanceResult.error;
        }

        setLogs(
          logsResult.data || []
        );

        setVideos(
          videosResult.data || []
        );

        const guidanceRow =
          guidanceResult.data;

        const guidanceValue =
          guidanceRow?.guidance &&
          typeof guidanceRow
            .guidance === "object" &&
          !Array.isArray(
            guidanceRow.guidance
          )
            ? guidanceRow.guidance
            : null;

        if (guidanceValue) {
          setGuidance({
            ...guidanceValue,

            guidance_date:
              guidanceRow
                .guidance_date,

            generated_at:
              guidanceRow
                .generated_at,
          });
        } else {
          setGuidance(null);
        }
      } catch (error) {
        console.error(
          "Home load error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "The Home page could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHome();
  }, []);

  const homeState =
    getHomeState(logs);

  const guidanceBasis =
    Array.isArray(
      guidance?.basis
    )
      ? guidance.basis
      : [];

  return (
    <>
      <section className="grid four">
        <div className="panel">
          <p className="label">
            Practice Rhythm
          </p>

          <div className="big">
            {homeState.making.toFixed(
              1
            )}
            h
          </div>

          <p className="muted">
            Making / day this
            month
          </p>

          <p className="muted">
            Learning{" "}
            {homeState.learning.toFixed(
              1
            )}
            h / day
          </p>
        </div>

        <div className="panel">
          <p className="label">
            Body Weather
          </p>

          <div className="big">
            {
              homeState.bodyWeather
            }
          </div>

          <p className="muted">
            this week
          </p>
        </div>

        <div className="panel">
          <p className="label">
            Energy Tone
          </p>

          <div className="big">
            {
              homeState.energyTone
            }
          </div>

          <p className="muted">
            this week
          </p>
        </div>

        <div className="panel">
          <p className="label">
            Current Mode
          </p>

          <div className="big">
            {homeState.mode}
          </div>
        </div>
      </section>

      <section className="panel soft-suggestion">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              Today
            </p>

            <h2>
              Today&apos;s Soft
              Suggestion
            </h2>
          </div>

          {guidance
            ?.generated_at && (
            <span className="badge">
              Updated{" "}
              {formatDateTime(
                guidance.generated_at
              )}
            </span>
          )}
        </div>

        {loading && (
          <p className="muted">
            Loading today&apos;s
            suggestion…
          </p>
        )}

        {!loading &&
          errorMessage && (
            <p className="muted">
              {errorMessage}
            </p>
          )}

        {!loading &&
          !errorMessage &&
          guidance && (
            <>
              {guidance.state && (
                <div className="soft-suggestion-state">
                  {
                    guidance.state
                  }
                </div>
              )}

              {guidance.reading && (
                <p className="soft-suggestion-reading">
                  {
                    guidance.reading
                  }
                </p>
              )}

              {guidance.suggested_gesture && (
                <section className="soft-suggestion-gesture">
                  <p className="block-title">
                    Suggested Gesture
                  </p>

                  <p>
                    {
                      guidance.suggested_gesture
                    }
                  </p>
                </section>
              )}

              {guidance.avoid && (
                <section className="soft-suggestion-detail">
                  <p className="block-title">
                    Keep Light
                  </p>

                  <p>
                    {
                      guidance.avoid
                    }
                  </p>
                </section>
              )}

              {guidanceBasis.length >
                0 && (
                <section className="soft-suggestion-detail">
                  <p className="block-title">
                    Based On
                  </p>

                  {guidanceBasis.map(
                    (
                      item,
                      index
                    ) => (
                      <p
                        key={`${item}-${index}`}
                      >
                        — {item}
                      </p>
                    )
                  )}
                </section>
              )}

              {guidance.confidence_note && (
                <p className="muted">
                  {
                    guidance.confidence_note
                  }
                </p>
              )}
            </>
          )}

        {!loading &&
          !errorMessage &&
          !guidance && (
            <>
              <p className="muted">
                No Soft Suggestion
                has been generated
                yet.
              </p>

              <p className="muted">
                The first suggestion
                will appear after the
                nightly system update
                runs.
              </p>
            </>
          )}
      </section>

      <section className="panel">
        <h2>Latest Daily</h2>

        {logs
          .slice(0, 2)
          .map((log) => (
            <EntryCard
              key={log.id}
              log={log}
            />
          ))}

        {!logs.length &&
          !loading && (
            <p className="muted">
              No public Daily
              records yet.
            </p>
          )}
      </section>

      <section className="panel">
        <h2>
          Latest Archive
        </h2>

        <div className="video-grid">
          {videos
            .slice(0, 3)
            .map((video) => (
              <VideoCard
                key={video.id}
                video={video}
              />
            ))}
        </div>

        {!videos.length &&
          !loading && (
            <p className="muted">
              No public Archive
              videos yet.
            </p>
          )}
      </section>
    </>
  );
}
