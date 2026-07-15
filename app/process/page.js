"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "../../lib/supabaseClient";

import {
  getHomeState,
  parseNumber,
  parseWorkHours,
  getLearningHours,
} from "../../lib/utils";

function getSafeObject(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
}

function getSafeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function parseDurationHours(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const text = String(value)
    .trim()
    .toLowerCase();

  if (!text) {
    return 0;
  }

  const direct =
    Number(text);

  if (Number.isFinite(direct)) {
    return direct;
  }

  let total = 0;

  const hourMatch =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/
    );

  const minuteMatch =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/
    );

  if (hourMatch) {
    total +=
      Number(hourMatch[1]);
  }

  if (minuteMatch) {
    total +=
      Number(minuteMatch[1]) /
      60;
  }

  return Number.isFinite(total)
    ? total
    : 0;
}

function numericRows(logs) {
  return logs
    .slice()
    .sort((first, second) =>
      String(first.date)
        .localeCompare(
          String(second.date)
        )
    )
    .map((log, index) => {
      const state =
        getSafeObject(
          log.state
        );

      const movement =
        getSafeObject(
          log.movement
        );

      const environment =
        getSafeObject(
          log.environment
        );

      return {
        index,

        date:
          log.date || "",

        body_temperature:
          parseNumber(
            state.temperature
          ),

        weight:
          parseNumber(
            state.weight
          ),

        body_state:
          parseNumber(
            state.body_state
          ),

        energy:
          parseNumber(
            state.energy
          ),

        mood:
          parseNumber(
            state.mood
          ),

        moving_hours:
          parseDurationHours(
            movement.time
          ),

        moving_intensity:
          parseNumber(
            movement.intensity
          ),

        making_hours:
          parseWorkHours(
            log.work?.time
          ),

        learning_hours:
          getLearningHours(log),

        weather_temperature:
          parseNumber(
            environment.temperature ??
              state.weather_temperature
          ),

        humidity:
          parseNumber(
            environment.humidity ??
              state.humidity
          ),

        pressure:
          parseNumber(
            environment.pressure ??
              state.pressure
          ),

        wind:
          parseNumber(
            environment.wind ??
              state.wind
          ),
      };
    });
}

const DATA_HEADERS = [
  "index",
  "date",
  "body_temperature",
  "weight",
  "body_state",
  "energy",
  "mood",
  "moving_hours",
  "moving_intensity",
  "making_hours",
  "learning_hours",
  "weather_temperature",
  "humidity",
  "pressure",
  "wind",
];

function toCSV(rows) {
  const clean = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replaceAll(
        '"',
        '""'
      );
  };

  return [
    DATA_HEADERS.join(","),

    ...rows.map((row) =>
      DATA_HEADERS
        .map(
          (key) =>
            `"${clean(
              row[key]
            )}"`
        )
        .join(",")
    ),
  ].join("\n");
}

function download(
  filename,
  text,
  type
) {
  const blob =
    new Blob(
      [text],
      { type }
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
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
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

export default function ProcessPage() {
  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    systemSnapshot,
    setSystemSnapshot,
  ] = useState(null);

  const [
    weaveSnapshot,
    setWeaveSnapshot,
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
    async function loadProcess() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [
          logsResult,
          systemResult,
          weaveResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "field_logs"
              )
              .select("*")
              .eq(
                "is_public",
                true
              )
              .order(
                "date",
                {
                  ascending:
                    true,
                }
              ),

            supabase
              .from(
                "system_snapshots"
              )
              .select(
                `
                  snapshot_date,
                  period_days,
                  reading,
                  generated_at,
                  is_public
                `
              )
              .eq(
                "is_public",
                true
              )
              .order(
                "snapshot_date",
                {
                  ascending:
                    false,
                }
              )
              .limit(1)
              .maybeSingle(),

            supabase
              .from(
                "weave_snapshots"
              )
              .select(
                `
                  snapshot_date,
                  nodes,
                  edges,
                  meta,
                  generated_at,
                  is_public
                `
              )
              .eq(
                "is_public",
                true
              )
              .order(
                "snapshot_date",
                {
                  ascending:
                    false,
                }
              )
              .limit(1)
              .maybeSingle(),
          ]);

        if (logsResult.error) {
          throw logsResult.error;
        }

        if (systemResult.error) {
          throw systemResult.error;
        }

        if (weaveResult.error) {
          throw weaveResult.error;
        }

        setLogs(
          logsResult.data || []
        );

        setSystemSnapshot(
          systemResult.data
            ? {
                ...systemResult.data,

                reading:
                  getSafeObject(
                    systemResult
                      .data
                      .reading
                  ),
              }
            : null
        );

        setWeaveSnapshot(
          weaveResult.data
            ? {
                ...weaveResult.data,

                nodes:
                  getSafeArray(
                    weaveResult
                      .data
                      .nodes
                  ),

                edges:
                  getSafeArray(
                    weaveResult
                      .data
                      .edges
                  ),

                meta:
                  getSafeObject(
                    weaveResult
                      .data
                      .meta
                  ),
              }
            : null
        );
      } catch (error) {
        console.error(
          "Process load error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Process data could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProcess();
  }, []);

  const homeState =
    getHomeState(logs);

  const rows =
    useMemo(
      () =>
        numericRows(logs),
      [logs]
    );

  const making =
    useMemo(
      () =>
        logs.reduce(
          (sum, log) =>
            sum +
            parseWorkHours(
              log.work?.time
            ),
          0
        ),
      [logs]
    );

  const learning =
    useMemo(
      () =>
        logs.reduce(
          (sum, log) =>
            sum +
            getLearningHours(log),
          0
        ),
      [logs]
    );

  const moving =
    useMemo(
      () =>
        logs.reduce(
          (sum, log) =>
            sum +
            parseDurationHours(
              log.movement?.time
            ),
          0
        ),
      [logs]
    );

  const moodValues =
    logs
      .map((log) =>
        Number(
          log.state?.mood
        )
      )
      .filter(
        Number.isFinite
      );

  const averageMood =
    moodValues.length
      ? moodValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        moodValues.length
      : 0;

  let mindWeather =
    "Unknown";

  if (averageMood >= 8) {
    mindWeather = "Clear";
  } else if (
    averageMood >= 6
  ) {
    mindWeather = "Stable";
  } else if (
    averageMood >= 4
  ) {
    mindWeather = "Cloudy";
  } else if (
    averageMood > 0
  ) {
    mindWeather = "Heavy";
  }

  const reading =
    getSafeObject(
      systemSnapshot?.reading
    );

  const weaveMeta =
    getSafeObject(
      weaveSnapshot?.meta
    );

  const weaveNodes =
    getSafeArray(
      weaveSnapshot?.nodes
    );

  const weaveEdges =
    getSafeArray(
      weaveSnapshot?.edges
    );

  return (
    <>
      <section className="panel">
        <p className="eyebrow">
          Process
        </p>

        <h2>
          Records becoming
          patterns and
          relationships
        </h2>

        <p className="subtitle">
          Accumulated rhythms,
          numeric data, System
          readings, and semantic
          connections generated
          from Input.
        </p>
      </section>

      {loading && (
        <section className="panel">
          <p className="muted">
            Loading Process…
          </p>
        </section>
      )}

      {!loading &&
        errorMessage && (
          <section className="panel">
            <p className="muted">
              {errorMessage}
            </p>
          </section>
        )}

      {!loading &&
        !errorMessage && (
          <>
            <section className="panel">
              <div className="entry-head">
                <div>
                  <p className="eyebrow">
                    Stats
                  </p>

                  <h2>
                    Accumulated
                    Rhythms
                  </h2>
                </div>

                <Link href="/stats">
                  Open Stats
                </Link>
              </div>

              <div className="grid three">
                <div className="panel">
                  <p className="label">
                    Making
                  </p>

                  <div className="big">
                    {making.toFixed(
                      1
                    )}
                    h
                  </div>
                </div>

                <div className="panel">
                  <p className="label">
                    Learning
                  </p>

                  <div className="big">
                    {learning.toFixed(
                      1
                    )}
                    h
                  </div>
                </div>

                <div className="panel">
                  <p className="label">
                    Moving
                  </p>

                  <div className="big">
                    {moving.toFixed(
                      1
                    )}
                    h
                  </div>
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
                </div>

                <div className="panel">
                  <p className="label">
                    Mind Weather
                  </p>

                  <div className="big">
                    {mindWeather}
                  </div>
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
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="entry-head">
                <div>
                  <p className="eyebrow">
                    Data
                  </p>

                  <h2>
                    Numeric Data
                  </h2>
                </div>

                <Link href="/data">
                  Open Data
                </Link>
              </div>

              <p className="subtitle">
                Numeric body,
                Body Moving,
                making, learning,
                and weather data
                for mapping and
                external systems.
              </p>

              <div className="actions">
                <button
                  className="primary"
                  type="button"
                  onClick={() =>
                    download(
                      "SOFTSYSTEM_numeric_data.csv",
                      toCSV(rows),
                      "text/csv"
                    )
                  }
                >
                  Export CSV
                </button>

                <button
                  type="button"
                  onClick={() =>
                    download(
                      "SOFTSYSTEM_numeric_data.json",
                      JSON.stringify(
                        rows,
                        null,
                        2
                      ),
                      "application/json"
                    )
                  }
                >
                  Export JSON
                </button>
              </div>

              <div className="block">
                <p className="block-title">
                  Mapping Fields
                </p>

                <p>
                  body_temperature /
                  weight /
                  body_state /
                  energy / mood
                </p>

                <p>
                  moving_hours /
                  moving_intensity
                </p>

                <p>
                  making_hours /
                  learning_hours
                </p>

                <p>
                  weather_temperature /
                  humidity /
                  pressure / wind
                </p>
              </div>

              <p className="muted">
                {rows.length} public
                records available.
              </p>
            </section>

            <section className="panel">
              <div className="entry-head">
                <div>
                  <p className="eyebrow">
                    System
                  </p>

                  <h2>
                    Current System
                    Reading
                  </h2>
                </div>

                <Link href="/system">
                  View Full
                </Link>
              </div>

              {systemSnapshot ? (
                <>
                  <p className="label">
                    Current Mode
                  </p>

                  <div className="big">
                    {reading.current_mode ||
                      "Unresolved"}
                  </div>

                  {reading.overview && (
                    <div className="block">
                      <p className="block-title">
                        Overview
                      </p>

                      <p>
                        {
                          reading.overview
                        }
                      </p>
                    </div>
                  )}

                  {reading.open_question && (
                    <div className="block">
                      <p className="block-title">
                        Open Question
                      </p>

                      <p>
                        {
                          reading.open_question
                        }
                      </p>
                    </div>
                  )}

                  {systemSnapshot.generated_at && (
                    <p className="muted">
                      Updated{" "}
                      {formatDateTime(
                        systemSnapshot
                          .generated_at
                      )}
                    </p>
                  )}
                </>
              ) : (
                <p className="muted">
                  No public System
                  reading yet.
                </p>
              )}
            </section>

            <section className="panel">
              <div className="entry-head">
                <div>
                  <p className="eyebrow">
                    Weave
                  </p>

                  <h2>
                    Latest Semantic
                    Snapshot
                  </h2>
                </div>

                <Link href="/weave">
                  View Weave
                </Link>
              </div>

              {weaveSnapshot ? (
                <>
                  <div className="grid three">
                    <div className="panel">
                      <p className="label">
                        Records
                      </p>

                      <div className="big">
                        {weaveMeta
                          .record_count ??
                          weaveNodes.length}
                      </div>
                    </div>

                    <div className="panel">
                      <p className="label">
                        Connections
                      </p>

                      <div className="big">
                        {
                          weaveEdges.length
                        }
                      </div>
                    </div>

                    <div className="panel">
                      <p className="label">
                        Threshold
                      </p>

                      <div className="big">
                        {weaveMeta.threshold ??
                          0.72}
                      </div>
                    </div>
                  </div>

                  {weaveSnapshot.generated_at && (
                    <p className="muted">
                      Updated{" "}
                      {formatDateTime(
                        weaveSnapshot
                          .generated_at
                      )}
                    </p>
                  )}
                </>
              ) : (
                <p className="muted">
                  No public Weave
                  snapshot yet.
                </p>
              )}
            </section>
          </>
        )}
    </>
  );
}
