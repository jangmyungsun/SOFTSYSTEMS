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

import { getIntlLocale } from "../../lib/i18n";
import { useLanguage } from "../../components/LanguageProvider";

function formatDateTime(value, locale) {
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
    getIntlLocale(locale),
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
    text.length <= maxLength
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

export default function WeavePage() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const locale = language?.locale ?? "en";
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
        .from("weave_snapshots")
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
            ascending: false,
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
          Array.isArray(data.nodes)
            ? data.nodes
            : [],

        edges:
          Array.isArray(data.edges)
            ? data.edges
            : [],

        meta:
          data.meta &&
          typeof data.meta ===
            "object" &&
          !Array.isArray(data.meta)
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
            (first, second) =>
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

    if (!nodes.length) {
      context.fillStyle =
        "#766f64";

      context.font =
        "15px monospace";

      context.fillText(
        t("weave.canvasEmpty"),
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
            ) *
            0.34;

          const variation =
            (
              index % 4
            ) *
            14;

          return {
            ...node,

            x:
              width / 2 +
              Math.cos(angle) *
                (
                  baseRadius -
                  variation
                ),

            y:
              height / 2 +
              Math.sin(angle) *
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
              ) /
                0.3
            )
          );

        context.beginPath();

        context.strokeStyle =
          `rgba(33,31,27,${
            0.09 +
            strength * 0.5
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
          ) /
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
            connectionCount * 1.5
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

        const artisticTitle =
          node.artistic_input
            ?.title || "";

        const label =
          artisticTitle ||
          node.themes?.join(
            ", "
          ) ||
          node.project ||
          node.summary;

        context.fillStyle =
          "#766f64";

        context.font =
          "9px monospace";

        context.fillText(
          shorten(
            label,
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
              {t("process.weave")}
            </p>

            <h2>
              {t("process.semanticConnections")}
            </h2>

            <p className="subtitle">
              {t("process.weaveSubtitle")}
            </p>
          </div>

          {snapshot?.generated_at && (
            <span className="badge">
              {t("common.updated")}{" "}
              {formatDateTime(
                snapshot.generated_at,
                locale
              )}
            </span>
          )}
        </div>

        <p className="muted">
          {t("process.generatedAutomatically")}
        </p>

        {snapshot?.meta && (
          <p className="muted">
            {t("weave.summary", {
              count: snapshot.meta.record_count || 0,
              connections: edges.length,
              threshold: snapshot.meta.threshold || 0.72,
            })}
          </p>
        )}
      </section>

      {loading && (
        <section className="panel">
          <p className="muted">
            {t("process.loadingWeave")}
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
              {t("process.noWeaveSnapshotYet")}
            </h2>

            <p className="muted">
              {t("process.noWeaveSnapshotText")}
            </p>
          </section>
        )}

      {!loading &&
        snapshot && (
          <>
            <section className="panel">
              <canvas
                ref={canvasRef}
                width="960"
                height="640"
              />
            </section>

            <section className="panel">
              <h2>
                {t("process.strongestConnections")}
              </h2>

              {!strongestConnections
                .length && (
                <p className="muted">
                  {t("process.noConnections")}
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
                        <p>
                          {source.date}
                          {" ↔ "}
                          {target.date}
                        </p>

                        <span className="badge">
                          {Math.round(
                            edge.similarity *
                              100
                          )}
                          %
                        </span>
                      </div>

                      <div className="grid two">
                        <div>
                          <p className="block-title">
                            {t("process.firstRecord")}
                          </p>

                          <p className="weave-body">
                            {
                              source.summary
                            }
                          </p>

                          {source
                            .artistic_input
                            ?.title && (
                            <p className="muted">
                              Artistic Input —{" "}
                              {
                                source
                                  .artistic_input
                                  .title
                              }
                            </p>
                          )}

                          {source.themes
                            ?.length >
                            0 && (
                            <p className="muted">
                              {
                                source.themes.join(
                                  ", "
                                )
                              }
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="block-title">
                            {t("process.secondRecord")}
                          </p>

                          <p className="weave-body">
                            {
                              target.summary
                            }
                          </p>

                          {target
                            .artistic_input
                            ?.title && (
                            <p className="muted">
                              Artistic Input —{" "}
                              {
                                target
                                  .artistic_input
                                  .title
                              }
                            </p>
                          )}

                          {target.themes
                            ?.length >
                            0 && (
                            <p className="muted">
                              {
                                target.themes.join(
                                  ", "
                                )
                              }
                            </p>
                          )}
                        </div>
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

