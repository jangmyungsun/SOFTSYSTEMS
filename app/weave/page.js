"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "../../lib/supabaseClient";

function shorten(text, length = 44) {
  const value = String(text || "");

  return value.length > length
    ? `${value.slice(0, length)}…`
    : value;
}

export default function WeavePage() {
  const canvasRef =
    useRef(null);

  const [
    session,
    setSession,
  ] = useState(null);

  const [
    weave,
    setWeave,
  ] = useState({
    nodes: [],
    edges: [],
    meta: null,
  });

  const [
    status,
    setStatus,
  ] = useState("idle");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(
          data.session
        );
      });
  }, []);

  const generateWeave =
    async () => {
      if (!session) {
        setErrorMessage(
          "Please log in first."
        );

        return;
      }

      setStatus("loading");
      setErrorMessage("");

      try {
        const response =
          await fetch(
            "/api/weave",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${session.access_token}`,
              },
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
            "Semantic Weave failed."
          );
        }

        setWeave(result);
        setStatus("ready");
      } catch (error) {
        console.error(error);

        setErrorMessage(
          error.message ||
          "Semantic Weave failed."
        );

        setStatus("error");
      }
    };

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

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

    const nodes =
      weave.nodes.map(
        (node, index) => {
          const angle =
            (index /
              Math.max(
                weave.nodes.length,
                1
              )) *
            Math.PI *
            2;

          const radius =
            Math.min(
              width,
              height
            ) *
            0.34;

          return {
            ...node,

            x:
              width / 2 +
              Math.cos(angle) *
                radius,

            y:
              height / 2 +
              Math.sin(angle) *
                radius,
          };
        }
      );

    if (!nodes.length) {
      context.fillStyle =
        "#766f64";

      context.font =
        "15px monospace";

      context.fillText(
        "Generate the semantic Weave to begin.",
        32,
        56
      );

      return;
    }

    weave.edges.forEach(
      (edge) => {
        const source =
          nodes.find(
            (node) =>
              node.id ===
              edge.source
          );

        const target =
          nodes.find(
            (node) =>
              node.id ===
              edge.target
          );

        if (!source || !target) {
          return;
        }

        const strength =
          Math.max(
            0,
            Math.min(
              1,
              (edge.similarity -
                0.7) /
                0.3
            )
          );

        context.beginPath();

        context.strokeStyle =
          `rgba(33,31,27,${
            0.1 +
            strength * 0.55
          })`;

        context.lineWidth =
          0.8 +
          strength * 4;

        context.moveTo(
          source.x,
          source.y
        );

        const middleX =
          (source.x +
            target.x) /
          2;

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

    nodes.forEach((node) => {
      const connectedEdges =
        weave.edges.filter(
          (edge) =>
            edge.source ===
              node.id ||
            edge.target ===
              node.id
        );

      const radius =
        5 +
        Math.min(
          12,
          connectedEdges.length *
            1.6
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

      context.fillStyle =
        "#766f64";

      context.font =
        "9px monospace";

      context.fillText(
        shorten(
          node.themes?.join(
            ", "
          ) ||
            node.project ||
            node.summary,
          28
        ),
        node.x +
          radius +
          6,
        node.y + 15
      );
    });
  }, [weave]);

  const topConnections =
    weave.edges
      .slice()
      .sort(
        (a, b) =>
          b.similarity -
          a.similarity
      )
      .slice(0, 12);

  const nodeMap =
    new Map(
      weave.nodes.map(
        (node) => [
          node.id,
          node,
        ]
      )
    );

  return (
    <>
      <section className="panel">
        <p className="eyebrow">
          Weave
        </p>

        <h2>
          Semantic Connections
        </h2>

        <p className="subtitle">
          AI embeddings connect Daily
          records by meaning, atmosphere,
          and recurring artistic signals,
          even when the same words were
          not used.
        </p>

        <div className="actions">
          <button
            className="primary"
            type="button"
            onClick={
              generateWeave
            }
            disabled={
              status ===
              "loading"
            }
          >
            {status ===
            "loading"
              ? "Generating…"
              : "Generate Semantic Weave"}
          </button>
        </div>

        {errorMessage && (
          <p className="muted">
            {errorMessage}
          </p>
        )}

        {weave.meta && (
          <p className="muted">
            {weave.meta.record_count} records ·{" "}
            {weave.edges.length} connections ·{" "}
            similarity threshold{" "}
            {weave.meta.threshold}
          </p>
        )}
      </section>

      <section className="panel">
        <canvas
          ref={canvasRef}
          width="960"
          height="640"
        />
      </section>

      <section className="panel">
        <h2>
          Strongest Connections
        </h2>

        {!topConnections.length && (
          <p className="muted">
            No semantic connections
            have been generated yet.
          </p>
        )}

        {topConnections.map(
          (edge, index) => {
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
                <p>
                  {source.date}
                  {" ↔ "}
                  {target.date}
                </p>

                <p className="muted">
                  Similarity{" "}
                  {Math.round(
                    edge.similarity *
                      100
                  )}
                  %
                </p>

                <div className="grid two">
                  <div>
                    <p className="block-title">
                      First Record
                    </p>

                    <p>
                      {source.summary}
                    </p>

                    <p className="muted">
                      {source.themes?.join(
                        ", "
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="block-title">
                      Second Record
                    </p>

                    <p>
                      {target.summary}
                    </p>

                    <p className="muted">
                      {target.themes?.join(
                        ", "
                      )}
                    </p>
                  </div>
                </div>
              </article>
            );
          }
        )}
      </section>
    </>
  );
}
