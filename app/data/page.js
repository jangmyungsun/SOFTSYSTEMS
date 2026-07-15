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
  parseNumber,
  parseWorkHours,
  getLearningHours,
} from "../../lib/utils";

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

  const directNumber =
    Number(text);

  if (
    Number.isFinite(
      directNumber
    )
  ) {
    return directNumber;
  }

  let totalHours = 0;

  const hourMatch =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/
    );

  const minuteMatch =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/
    );

  if (hourMatch) {
    totalHours +=
      Number(
        hourMatch[1]
      );
  }

  if (minuteMatch) {
    totalHours +=
      Number(
        minuteMatch[1]
      ) / 60;
  }

  return Number.isFinite(
    totalHours
  )
    ? totalHours
    : 0;
}

function getObject(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
}

function numericRows(logs) {
  return logs
    .slice()
    .sort((first, second) =>
      String(
        first.date
      ).localeCompare(
        String(
          second.date
        )
      )
    )
    .map(
      (log, index) => {
        const state =
          getObject(
            log.state
          );

        const environment =
          getObject(
            log.environment
          );

        const movement =
          getObject(
            log.movement
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
            getLearningHours(
              log
            ),

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
      }
    );
}

function download(
  filename,
  text,
  type
) {
  const blob =
    new Blob(
      [text],
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
  link.download =
    filename;

  link.click();

  URL.revokeObjectURL(
    url
  );
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
  const clean = (
    value
  ) => {
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

    ...rows.map(
      (row) =>
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

export default function DataPage() {
  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } = await supabase
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
        );

      if (error) {
        console.error(
          "Data load error:",
          error
        );

        setErrorMessage(
          error.message
        );

        setLogs([]);
        setLoading(false);

        return;
      }

      setLogs(
        data || []
      );

      setLoading(false);
    }

    loadData();
  }, []);

  const rows =
    useMemo(
      () =>
        numericRows(
          logs
        ),
      [logs]
    );

  return (
    <>
      <section className="panel">
        <h2>
          Data Output
        </h2>

        <p className="subtitle">
          Numeric body, Body
          Moving, weather,
          making, and learning
          data for Max/MSP,
          sound mapping, and
          visual systems.
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
      </section>

      <section className="panel">
        <h2>
          Mapping Fields
        </h2>

        <p>
          body_temperature /
          weight / body_state /
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
          humidity / pressure /
          wind
        </p>
      </section>

      <section className="panel">
        <h2>Preview</h2>

        {loading && (
          <p className="muted">
            Loading numeric
            data…
          </p>
        )}

        {!loading &&
          errorMessage && (
            <p className="muted">
              {errorMessage}
            </p>
          )}

        {!loading &&
          !errorMessage && (
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table>
                <thead>
                  <tr>
                    {DATA_HEADERS.map(
                      (key) => (
                        <th
                          key={
                            key
                          }
                        >
                          {key}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {rows.map(
                    (row) => (
                      <tr
                        key={`${row.date}-${row.index}`}
                      >
                        {DATA_HEADERS.map(
                          (
                            key
                          ) => (
                            <td
                              key={
                                key
                              }
                            >
                              {row[
                                key
                              ] ??
                                ""}
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        {!loading &&
          !errorMessage &&
          !rows.length && (
            <p className="muted">
              No public numeric
              data yet.
            </p>
          )}
      </section>
    </>
  );
}
