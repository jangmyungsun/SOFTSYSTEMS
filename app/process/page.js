"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "../../lib/supabaseClient";

const PROCESS_ITEMS = [
  {
    href: "/stats",
    eyebrow: "Stats",
    title: "Accumulated Rhythms",
    description:
      "Making, learning, Body Moving, body weather, mind weather, and energy tone across accumulated public records.",
    action: "Open Stats",
  },

  {
    href: "/data",
    eyebrow: "Data",
    title: "Numeric Output",
    description:
      "Structured body, movement, weather, making, and learning data prepared for CSV, JSON, Max/MSP, and visual mapping.",
    action: "Open Data",
  },

  {
    href: "/system",
    eyebrow: "System",
    title: "Period Reading",
    description:
      "An AI interpretation of recurring signals, relationships, shifts, and open questions across recent Daily records.",
    action: "Open System",
  },

  {
    href: "/weave",
    eyebrow: "Weave",
    title: "Semantic Connections",
    description:
      "A network of relationships among Daily records, Body Moving, environment, making, learning, artistic input, and observation.",
    action: "Open Weave",
  },
];

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
    async function loadProcessPreview() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [
          systemResult,
          weaveResult,
        ] =
          await Promise.all([
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

        if (
          systemResult.error
        ) {
          throw systemResult.error;
        }

        if (
          weaveResult.error
        ) {
          throw weaveResult.error;
        }

        if (
          systemResult.data
        ) {
          setSystemSnapshot({
            ...systemResult.data,

            reading:
              getSafeObject(
                systemResult
                  .data
                  .reading
              ),
          });
        } else {
          setSystemSnapshot(
            null
          );
        }

        if (
          weaveResult.data
        ) {
          setWeaveSnapshot({
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
          });
        } else {
          setWeaveSnapshot(
            null
          );
        }
      } catch (error) {
        console.error(
          "Process preview load error:",
          error
        );

        setSystemSnapshot(
          null
        );

        setWeaveSnapshot(
          null
        );

        setErrorMessage(
          error?.message ||
            "The latest Process results could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProcessPreview();
  }, []);

  const reading =
    getSafeObject(
      systemSnapshot?.reading
    );

  const recurringSignals =
    getSafeArray(
      reading.recurring_signals
    );

  const shifts =
    getSafeArray(
      reading.shifts
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

  const recordCount =
    weaveMeta.record_count ??
    weaveNodes.length;

  const connectionCount =
    weaveEdges.length;

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
          Stats, Data, System,
          and Weave organize,
          interpret, and connect
          material collected
          through Input.
        </p>
      </section>

      <section className="grid two">
        {PROCESS_ITEMS.map(
          (item) => (
            <article
              className="panel"
              key={item.href}
            >
              <p className="eyebrow">
                {item.eyebrow}
              </p>

              <h2>
                {item.title}
              </h2>

              <p className="subtitle">
                {item.description}
              </p>

              <div className="actions">
                <Link
                  href={item.href}
                  className="primary"
                >
                  {item.action}
                </Link>
              </div>
            </article>
          )
        )}
      </section>

      {loading && (
        <section className="panel">
          <p className="muted">
            Loading the latest
            Process results…
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
                  <div className="grid two">
                    <div>
                      <p className="label">
                        Current Mode
                      </p>

                      <div className="big">
                        {reading.current_mode ||
                          "Unresolved"}
                      </div>
                    </div>

                    <div>
                      <p className="label">
                        Period
                      </p>

                      <div className="big">
                        {reading.period_days ||
                          systemSnapshot.period_days ||
                          0}
                        d
                      </div>

                      <p className="muted">
                        {reading.record_count ||
                          0}{" "}
                        records
                      </p>
                    </div>
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

                  {recurringSignals.length >
                    0 && (
                    <div className="block">
                      <p className="block-title">
                        Recurring
                        Signal
                      </p>

                      <p>
                        {
                          recurringSignals[0]
                            ?.signal
                        }
                      </p>

                      {recurringSignals[0]
                        ?.evidence && (
                        <p className="muted">
                          {
                            recurringSignals[0]
                              .evidence
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {shifts.length >
                    0 && (
                    <div className="block">
                      <p className="block-title">
                        Recent Shift
                      </p>

                      <p>
                        {shifts[0]}
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
                  reading has been
                  generated yet.
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
                  <section className="grid three">
                    <div className="panel">
                      <p className="label">
                        Records
                      </p>

                      <div className="big">
                        {recordCount}
                      </div>
                    </div>

                    <div className="panel">
                      <p className="label">
                        Connections
                      </p>

                      <div className="big">
                        {
                          connectionCount
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
                  </section>

                  <p className="subtitle">
                    The latest
                    semantic network
                    connects Daily
                    records through
                    Body Moving,
                    environment,
                    making, learning,
                    artistic input,
                    observation, and
                    recurring themes.
                  </p>

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
                  snapshot has been
                  generated yet.
                </p>
              )}
            </section>
          </>
        )}
    </>
  );
}
