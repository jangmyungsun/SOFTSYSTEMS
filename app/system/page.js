"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabaseClient";

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

function downloadFile(
  name,
  content,
  type = "application/json"
) {
  const blob = new Blob(
    [content],
    {
      type,
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = name;
  link.click();

  URL.revokeObjectURL(url);
}

export default function SystemPage() {
  const [
    snapshot,
    setSnapshot,
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
    async function loadSnapshot() {
      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } = await supabase
        .from("system_snapshots")
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
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "System snapshot error:",
          error
        );

        setErrorMessage(
          error.message
        );

        setLoading(false);
        return;
      }

      if (!data) {
        setSnapshot(null);
        setLoading(false);
        return;
      }

      const reading =
        data.reading &&
        typeof data.reading ===
          "object" &&
        !Array.isArray(
          data.reading
        )
          ? data.reading
          : {};

      setSnapshot({
        ...data,
        reading,
      });

      setLoading(false);
    }

    loadSnapshot();
  }, []);

  const reading =
    snapshot?.reading || {};

  const recurringSignals =
    Array.isArray(
      reading.recurring_signals
    )
      ? reading.recurring_signals
      : [];

  const relationships =
    Array.isArray(
      reading.relationships
    )
      ? reading.relationships
      : [];

  const shifts =
    Array.isArray(
      reading.shifts
    )
      ? reading.shifts
      : [];

  const exportReading = () => {
    if (!snapshot) {
      return;
    }

    downloadFile(
      `SOFTSYSTEMS_system_${snapshot.snapshot_date}.json`,
      JSON.stringify(
        snapshot,
        null,
        2
      )
    );
  };

  return (
    <>
      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              System
            </p>

            <h2>
              Period Reading
            </h2>

            <p className="subtitle">
              A nightly reading of
              recent relationships
              among body, environment,
              practice, artistic input,
              and creation.
            </p>
          </div>

          {snapshot?.generated_at && (
            <span className="badge">
              Updated{" "}
              {formatDateTime(
                snapshot.generated_at
              )}
            </span>
          )}
        </div>

        <p className="muted">
          Generated automatically
          once each night.
        </p>
      </section>

      {loading && (
        <section className="panel">
          <p className="muted">
            Loading the latest
            System reading…
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
        !errorMessage &&
        !snapshot && (
          <section className="panel">
            <h2>
              No System Reading Yet
            </h2>

            <p className="muted">
              The first reading will
              appear after the nightly
              update runs.
            </p>
          </section>
        )}

      {!loading &&
        snapshot && (
          <>
            <section className="panel">
              <p className="label">
                Current Mode
              </p>

              <div className="big">
                {reading.current_mode ||
                  "Unresolved"}
              </div>

              {reading.overview && (
                <p>
                  {reading.overview}
                </p>
              )}

              {reading.confidence_note && (
                <p className="muted">
                  {
                    reading.confidence_note
                  }
                </p>
              )}

              <p className="muted">
                Based on{" "}
                {reading.record_count ||
                  0}{" "}
                records from the
                latest{" "}
                {snapshot.period_days ||
                  reading.period_days ||
                  30}{" "}
                days.
              </p>
            </section>

            <section className="grid two">
              <div className="panel">
                <h2>
                  Recurring Signals
                </h2>

                {recurringSignals.length >
                0 ? (
                  recurringSignals.map(
                    (
                      item,
                      index
                    ) => (
                      <article
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
                      </article>
                    )
                  )
                ) : (
                  <p className="muted">
                    No recurring
                    signals were
                    identified.
                  </p>
                )}
              </div>

              <div className="panel">
                <h2>Shifts</h2>

                {shifts.length > 0 ? (
                  shifts.map(
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
                  )
                ) : (
                  <p className="muted">
                    No clear shifts
                    were identified.
                  </p>
                )}
              </div>
            </section>

            <section className="panel">
              <h2>
                Relationships
              </h2>

              {relationships.length >
              0 ? (
                relationships.map(
                  (
                    item,
                    index
                  ) => (
                    <article
                      className="entry"
                      key={`${item.source}-${item.target}-${index}`}
                    >
                      <p>
                        {item.source}
                        {" → "}
                        {item.target}
                      </p>

                      <p className="muted">
                        {
                          item.observation
                        }
                      </p>
                    </article>
                  )
                )
              ) : (
                <p className="muted">
                  No grounded
                  relationships were
                  identified.
                </p>
              )}
            </section>

            {reading.open_question && (
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
            )}

            <section className="panel">
              <div className="actions">
                <button
                  type="button"
                  onClick={
                    exportReading
                  }
                >
                  Export Latest
                  Reading
                </button>
              </div>
            </section>
          </>
        )}
    </>
  );
}
