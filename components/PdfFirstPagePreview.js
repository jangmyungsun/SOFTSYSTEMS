"use client";

import { useEffect, useRef, useState } from "react";

const PDFJS_VERSION = "3.11.174";
const PDFJS_SCRIPT = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

let pdfJsPromise = null;

function loadPdfJs() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PDF preview is only available in the browser."));
  }

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      PDFJS_WORKER;
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfJsPromise) {
    return pdfJsPromise;
  }

  pdfJsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-softsystems-pdfjs="true"]');

    if (existing) {
      existing.addEventListener("load", () => {
        if (!window.pdfjsLib) {
          reject(new Error("PDF.js did not initialize."));
          return;
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          PDFJS_WORKER;
        resolve(window.pdfjsLib);
      }, { once: true });
      existing.addEventListener("error", () => {
        reject(new Error("PDF.js could not be loaded."));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PDFJS_SCRIPT;
    script.async = true;
    script.dataset.softsystemsPdfjs = "true";

    script.onload = () => {
      if (!window.pdfjsLib) {
        reject(new Error("PDF.js did not initialize."));
        return;
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };

    script.onerror = () => {
      reject(new Error("PDF.js could not be loaded."));
    };

    document.head.appendChild(script);
  }).catch((error) => {
    pdfJsPromise = null;
    throw error;
  });

  return pdfJsPromise;
}

export default function PdfFirstPagePreview({
  attachmentId,
  requestAccessToken,
  title = "PDF first page",
  className = "",
}) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const loadingTaskRef = useRef(null);
  const requestAccessTokenRef = useRef(requestAccessToken);
  const [status, setStatus] = useState("loading");

  requestAccessTokenRef.current = requestAccessToken;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function renderFirstPage() {
      try {
        setStatus("loading");

        const headers = {};

        if (requestAccessTokenRef.current) {
          try {
            const token = await requestAccessTokenRef.current();
            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }
          } catch {
            // Public archive previews can continue without an auth token.
          }
        }

        const response = await fetch(
          `/api/archive/attachments/${encodeURIComponent(attachmentId)}?raw=1`,
          {
            headers,
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("PDF preview could not be loaded.");
        }

        const pdfBytes = new Uint8Array(await response.arrayBuffer());
        const pdfjsLib = await loadPdfJs();

        if (cancelled) {
          return;
        }

        const loadingTask = pdfjsLib.getDocument({
          data: pdfBytes,
          disableAutoFetch: true,
          disableStream: true,
        });
        loadingTaskRef.current = loadingTask;

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        if (cancelled || !canvasRef.current) {
          return;
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = 900;
        const scale = Math.max(1, Math.min(2.25, targetWidth / baseViewport.width));
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          background: "rgb(255, 250, 244)",
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!cancelled) {
          setStatus("ready");
        }
      } catch (error) {
        if (error?.name === "AbortError" || cancelled) {
          return;
        }

        console.warn("PDF first-page preview error:", error);
        setStatus("error");
      }
    }

    if (attachmentId) {
      renderFirstPage();
    } else {
      setStatus("error");
    }

    return () => {
      cancelled = true;
      controller.abort();

      try {
        renderTaskRef.current?.cancel?.();
      } catch {
        // Ignore cancellation errors during unmount.
      }

      try {
        loadingTaskRef.current?.destroy?.();
      } catch {
        // Ignore cleanup errors during unmount.
      }
    };
  }, [attachmentId]);

  return (
    <div
      className={`archive-pdf-canvas-preview ${className} is-${status}`.trim()}
      title={title}
      aria-label={title}
    >
      <canvas ref={canvasRef} className="archive-pdf-canvas" />
      {status === "loading" && (
        <span className="archive-pdf-canvas-status">PDF</span>
      )}
      {status === "error" && (
        <span className="archive-pdf-canvas-status">PDF</span>
      )}
    </div>
  );
}
