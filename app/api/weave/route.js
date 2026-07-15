"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabaseClient";

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

function shorten(
  value,
  maxLength = 36
) {
  const text =
    String(value || "");

  if (
    text.length <=
    maxLength
  ) {
    return text;
  }

  return (
    text.slice(
      0,
      maxLength
    ) + "…"
  );
}

function formatLabel(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .split("-")
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getObject(value) {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
}

function getArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function getBodyMoving(node) {
  const bodyMoving =
    getObject(
      node?.body_moving
    );

  if (
    Object.keys(
      bodyMoving
    ).length
  ) {
    return bodyMoving;
  }

  return getObject(
    node?.body_practice
  );
}

function getMaking(node) {
  const making =
    getObject(
      node?.making
    );

  if (
    Object.keys(
      making
    ).length
  ) {
    return making;
  }

  return {
    project:
      node?.project || "",
    time: "",
    notes: [],
  };
}

function getNodeLabel(node) {
  const bodyMoving =
    getBodyMoving(node);

  const making =
    getMaking(node);

  const artisticInput =
    getObject(
      node?.artistic_input
    );

  const themes =
    getArray(
      node?.themes
    );

  return (
    bodyMoving.type ||
    artisticInput.title ||
    making.project ||
    themes.join(", ") ||
    node?.summary ||
    node?.date ||
    "Daily"
  );
}

function BodyMovingLine({
  node,
}) {
  const bodyMoving =
    getBodyMoving(node);

  if (
    !bodyMoving.type &&
    !bodyMoving.time &&
    !bodyMoving.intensity &&
    !bodyMoving.notes
  ) {
    return null;
  }

  return (
    <div className="weave-detail-group">
      <p className="block-title">
        Body Moving
      </p>

      {bodyMoving.type && (
        <p>
          Type —{" "}
          {formatLabel(
            bodyMoving.type
          )}
        </p>
      )}

      {bodyMoving.time && (
        <p>
          Time —{" "}
          {bodyMoving.time}
        </p>
      )}

      {bodyMoving.intensity && (
        <p>
          Intensity —{" "}
          {
            bodyMoving.intensity
          }
          /5
        </p>
      )}

      {bodyMoving.notes && (
        <p className="muted">
          {bodyMoving.notes}
        </p>
      )}
    </div>
  );
}

function MakingLine({
  node,
}) {
  const making =
    getMaking(node);

  const notes =
    getArray(
      making.notes
    );

  if (
    !making.project &&
    !making.time &&
    !notes.length
  ) {
    return null;
  }

  return (
    <div className="weave-detail-group">
      <p className="block-title">
        Making
      </p>

      {making.project && (
        <p>
          Project —{" "}
          {making.project}
        </p>
      )}

      {making.time && (
        <p>
          Time —{" "}
          {making.time}
        </p>
      )}

      {notes.map(
        (item, index) => (
          <p
            className="muted"
            key={`${item}-${index}`}
          >
            {item}
          </p>
        )
      )}
    </div>
  );
}

function ArtisticInputLine({
  node,
}) {
  const artisticInput =
    getObject(
      node?.artistic_input
    );

  if (
    !artisticInput.type &&
    !artisticInput.title &&
    !artisticInput.creator &&
    !artisticInput.note
  ) {
    return null;
  }

  return (
    <div className="weave-detail-group">
      <p className="block-title">
        Artistic Input
      </p>

      {artisticInput.type && (
        <p>
          Type —{" "}
          {formatLabel(
            artisticInput.type
          )}
        </p>
      )}

      {artisticInput.title && (
        <p>
          Title —{" "}
          {artisticInput.title}
        </p>
      )}

      {artisticInput.creator && (
        <p>
          Creator —{" "}
          {artisticInput.creator}
        </p>
      )}

      {artisticInput.note && (
        <p className="muted">
          {artisticInput.note}
        </p>
      )}
    </div>
  );
}

function NodeReading({
  node,
  title,
}) {
  const themes =
    getArray(
      node?.themes
    );

  const emotions =
    getArray(
      node?.emotions
    );

  const keywords =
    getArray(
      node?.keywords
    );

  const environment =
    getObject(
      node?.environment
    );

  const learning =
    getArray(
      node?.learning
    );

  return (
    <div>
      <p className="block-title">
        {title}
      </p>

      <p className="weave-date">
        {node.date}
      </p>

      <p className="weave-summary">
        {node.summary ||
          "No summary available."}
      </p>

      <div className="weave-state-line">
        {node.body_state !==
          "" &&
          node.body_state !==
            undefined && (
            <span>
              Body{" "}
              {
                node.body_state
              }
            </span>
          )}

        {node.energy !== "" &&
          node.energy !==
            undefined && (
            <span>
              Energy{" "}
              {node.energy}
            </span>
          )}

        {node.mood !== "" &&
          node.mood !==
            undefined && (
            <span>
              Mood{" "}
              {node.mood}
            </span>
          )}

        {(environment.weather ||
          node.weather) && (
          <span>
            {environment.weather ||
              node.weather}
          </span>
        )}
      </div>

      <BodyMovingLine
        node={node}
      />

      <MakingLine
        node={node}
      />

      <ArtisticInputLine
        node={node}
      />

      {learning.length > 0 && (
        <div className="weave-detail-group">
          <p className="block-title">
            Learning
          </p>

          {learning.map(
            (item, index) => (
              <p
                key={`${item}-${index}`}
              >
                {item}
              </p>
            )
          )}
        </div>
      )}

      {node.observation && (
        <div className="weave-detail-group">
          <p className="block-title">
            Observation
          </p>

          <p>
            {
              node.observation
            }
          </p>
        </div>
      )}

      {node.alignment && (
        <div className="weave-detail-group">
          <p className="block-title">
            Alignment
          </p>

          <p>
            {node.alignment}
          </p>
        </div>
      )}

      {node.relationship && (
        <div className="weave-detail-group">
          <p className="block-title">
            System Relationship
          </p>

          <p className="muted">
            {
              node.relationship
            }
          </p>
        </div>
      )}

      {themes.length > 0 && (
        <div className="weave-detail-group">
          <p className="block-title">
            Themes
          </p>

          <div className="tag-list">
            {themes.map(
              (item, index) => (
                <span
                  className="tag"
                  key={`${item}-${index}`}
                >
                  {item}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {emotions.length >
        0 && (
        <div className="weave-detail-group">
          <p className="block-title">
            Emotions
          </p>

          <div className="tag-list">
            {emotions.map(
              (item, index) => (
                <span
                  className="tag"
                  key={`${item}-${index}`}
                >
                  {item}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {keywords.length >
        0 && (
        <div className="weave-detail-group">
          <p className="block-title">
            Keywords
          </p>

          <div className="tag-list">
            {keywords.map(
              (item, index) => (
                <span
                  className="tag"
                  key={`${item}-${index}`}
                >
                  {item}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WeavePage() {
  const canvasRef =
    useRef(null);

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
        .maybeSingle();

      if (error) {
        console.error(
          "Weave snapshot error:",
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

      setSnapshot({
        ...data,

        nodes:
          Array.isArray(
            data.nodes
          )
            ? data.nodes
            : [],

        edges:
          Array.isArray(
            data.edges
          )
            ? data.edges
            : [],

        meta:
          data.meta &&
          typeof data.meta ===
            "object" &&
          !Array.isArray(
            data.meta
          )
            ? data.meta
            : {},
      });

      setLoading(false);
    }

    loadSnapshot();
  }, []);

  const nodes =
    snapshot?.nodes || [];

  const edges =
    snapshot?.edges || [];

  const nodeMap =
    useMemo(
      () =>
        new Map(
          nodes.map(
            (node) => [
              node.id,
              node,
            ]
          )
        ),
      [nodes]
    );

  const strongestConnections =
    useMemo(
      () =>
        edges
          .slice()
          .sort(
            (
              first,
              second
            ) =>
              second.similarity -
              first.similarity
          )
          .slice(0, 12),
      [edges]
    );

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext(
        "2d"
      );

    const width =
      canvas.width;

    const height =
      canvas.height;

    context.clearRect(
      0,
      0,
      width,
      height
    );

    if (!nodes.length) {
      context.fillStyle =
        "#766f64";

      context.font =
        "15px monospace";

      context.fillText(
        "The nightly Weave has not been generated yet.",
        32,
        56
      );

      return;
    }

    const positionedNodes =
      nodes.map(
        (node, index) => {
          const angle =
            (
              index /
              Math.max(
                nodes.length,
                1
              )
            ) *
            Math.PI *
            2;

          const baseRadius =
            Math.min(
              width,
              height
            ) * 0.34;

          const variation =
            (index % 4) *
            14;

          return {
            ...node,

            x:
              width / 2 +
              Math.cos(
                angle
              ) *
                (
                  baseRadius -
                  variation
                ),

            y:
              height / 2 +
              Math.sin(
                angle
              ) *
                (
                  baseRadius -
                  variation
                ),
          };
        }
      );

    edges.forEach(
      (edge) => {
        const source =
          positionedNodes.find(
            (node) =>
              node.id ===
              edge.source
          );

        const target =
          positionedNodes.find(
            (node) =>
              node.id ===
              edge.target
          );

        if (
          !source ||
          !target
        ) {
          return;
        }

        const strength =
          Math.max(
            0,
            Math.min(
              1,
              (
                edge.similarity -
                0.7
              ) / 0.3
            )
          );

        context.beginPath();

        context.strokeStyle =
          `rgba(33,31,27,${
            0.09 +
            strength *
              0.5
          })`;

        context.lineWidth =
          0.8 +
          strength * 4;

        context.moveTo(
          source.x,
          source.y
        );

        const middleX =
          (
            source.x +
            target.x
          ) / 2;

        context.bezierCurveTo(
          middleX,
          source.y,
          middleX,
          target.y,
          target.x,
          target.y
        );

        context.stroke();
      }
    );

    positionedNodes.forEach(
      (node) => {
        const connectionCount =
          edges.filter(
            (edge) =>
              edge.source ===
                node.id ||
              edge.target ===
                node.id
          ).length;

        const radius =
          5 +
          Math.min(
            11,
            connectionCount *
              1.5
          );

        context.beginPath();

        context.fillStyle =
          "rgba(33,31,27,.72)";

        context.arc(
          node.x,
          node.y,
          radius,
          0,
          Math.PI * 2
        );

        context.fill();

        context.fillStyle =
          "#211f1b";

        context.font =
          "11px monospace";

        context.fillText(
          node.date || "",
          node.x +
            radius +
            6,
          node.y
        );

        const label =
          getNodeLabel(
            node
          );

        context.fillStyle =
          "#766f64";

        context.font =
          "9px monospace";

        context.fillText(
          shorten(
            formatLabel(
              label
            ),
            28
          ),
          node.x +
            radius +
            6,
          node.y + 15
        );
      }
    );
  }, [
    nodes,
    edges,
  ]);

  return (
    <>
      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              Weave
            </p>

            <h2>
              Semantic Connections
            </h2>

            <p className="subtitle">
              Daily records are
              connected through
              Body Moving,
              environment,
              making, learning,
              artistic input,
              observation, and
              recurring concerns.
            </p>
          </div>

          {snapshot
            ?.generated_at && (
            <span className="badge">
              Updated{" "}
              {formatDateTime(
                snapshot
                  .generated_at
              )}
            </span>
          )}
        </div>

        <p className="muted">
          Generated automatically
          once each night.
        </p>

        {snapshot?.meta && (
          <>
            <p className="muted">
              {snapshot.meta
                .record_count ||
                0}{" "}
              records ·{" "}
              {edges.length}{" "}
              connections ·
              threshold{" "}
              {snapshot.meta
                .threshold ||
                0.72}
            </p>

            {snapshot.meta
              .includes_body_moving && (
              <p className="muted">
                Body Moving,
                Making, Learning,
                Observation, and
                Artistic Input are
                included in this
                reading.
              </p>
            )}
          </>
        )}
      </section>

      {loading && (
        <section className="panel">
          <p className="muted">
            Loading the latest
            Weave…
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
              No Weave Snapshot Yet
            </h2>

            <p className="muted">
              The first semantic
              network will appear
              after the nightly
              update runs.
            </p>
          </section>
        )}

      {!loading &&
        snapshot && (
          <>
            <section className="panel">
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <canvas
                  ref={
                    canvasRef
                  }
                  width="960"
                  height="640"
                />
              </div>
            </section>

            <section className="panel">
              <h2>
                Strongest
                Connections
              </h2>

              <p className="subtitle">
                These pairs share
                the closest
                semantic
                relationship in
                the current
                snapshot.
              </p>

              {!strongestConnections
                .length && (
                <p className="muted">
                  No connection
                  reached the
                  current
                  similarity
                  threshold.
                </p>
              )}

              {strongestConnections.map(
                (
                  edge,
                  index
                ) => {
                  const source =
                    nodeMap.get(
                      edge.source
                    );

                  const target =
                    nodeMap.get(
                      edge.target
                    );

                  if (
                    !source ||
                    !target
                  ) {
                    return null;
                  }

                  return (
                    <article
                      className="entry"
                      key={`${edge.source}-${edge.target}-${index}`}
                    >
                      <div className="entry-head">
                        <div>
                          <p className="eyebrow">
                            Connection
                          </p>

                          <p>
                            {
                              source.date
                            }
                            {" ↔ "}
                            {
                              target.date
                            }
                          </p>
                        </div>

                        <span className="badge">
                          {Math.round(
                            edge.similarity *
                              100
                          )}
                          %
                        </span>
                      </div>

                      <div className="grid two">
                        <NodeReading
                          node={
                            source
                          }
                          title="First Record"
                        />

                        <NodeReading
                          node={
                            target
                          }
                          title="Second Record"
                        />
                      </div>
                    </article>
                  );
                }
              )}
            </section>
          </>
        )}
    </>
  );
}
