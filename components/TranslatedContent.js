"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useLanguage } from "./LanguageProvider";

const TRANSLATION_CACHE_PREFIX = "softsystems_translation_cache_v2";
const MEMORY_CACHE = new Map();

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function hashText(value) {
  let hash = 0;
  const text = String(value || "");

  for (let index = 0; index < text.length; index += 1) {
    const character = text.charCodeAt(index);
    hash = (hash << 5) - hash + character;
    hash |= 0;
  }

  return String(hash);
}

function getCacheKey(contentKey, originalText, sourceLanguage, targetLanguage) {
  return `${TRANSLATION_CACHE_PREFIX}:${contentKey}:${sourceLanguage}:${targetLanguage}:${hashText(originalText)}`;
}

function readCache(cacheKey) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cachedValue = window.localStorage.getItem(cacheKey);

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue);
  } catch (error) {
    return null;
  }
}

function writeCache(cacheKey, translatedText) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify({ translatedText }));
  } catch (error) {
    // ignore cache write errors
  }
}

export default function TranslatedContent({
  contentKey,
  text,
  sourceLanguage = "en",
  targetLanguage,
  as: Component = "div",
  className = "",
  autoTranslate = true,
  preserveWhitespace = true,
  label = "",
}) {
  const language = useLanguage();
  const locale = language?.locale ?? "en";
  const resolvedTargetLanguage = targetLanguage || locale;
  const normalizedText = useMemo(() => normalizeText(text), [text]);
  const [displayMode, setDisplayMode] = useState("original");
  const [translatedText, setTranslatedText] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const activeRequestRef = useRef("");
  const abortRef = useRef(null);

  const isSameLanguage = String(sourceLanguage || "en").toLowerCase() === String(resolvedTargetLanguage || "en").toLowerCase();
  const hasText = normalizedText.trim().length > 0;

  useEffect(() => {
    setTranslatedText("");
    setStatus("idle");
    setError("");
    setDisplayMode("original");
    activeRequestRef.current = "";

    if (!hasText || !autoTranslate || isSameLanguage || !contentKey) {
      return undefined;
    }

    const cacheKey = getCacheKey(contentKey, normalizedText, sourceLanguage, resolvedTargetLanguage);
    const cachedValue = MEMORY_CACHE.get(cacheKey) || readCache(cacheKey);

    if (cachedValue?.translatedText) {
      setTranslatedText(cachedValue.translatedText);
      setStatus("ready");
      setDisplayMode("translated");
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const requestId = `${contentKey}:${normalizedText}:${sourceLanguage}:${resolvedTargetLanguage}`;
    activeRequestRef.current = requestId;
    setStatus("loading");

    async function loadTranslation() {
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            contentKey,
            originalText: normalizedText,
            sourceLanguage,
            targetLanguage: resolvedTargetLanguage,
          }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload.translatedText) {
          throw new Error(payload.error || "Translation failed.");
        }

        if (activeRequestRef.current !== requestId) {
          return;
        }

        MEMORY_CACHE.set(cacheKey, payload.translatedText);
        writeCache(cacheKey, payload.translatedText);
        setTranslatedText(payload.translatedText);
        setStatus("ready");
        setDisplayMode("translated");
      } catch (translationError) {
        if (controller.signal.aborted || activeRequestRef.current !== requestId) {
          return;
        }

        setError(translationError.message || "Translation failed.");
        setStatus("error");
        setDisplayMode("original");
      }
    }

    loadTranslation();

    return () => {
      controller.abort();
    };
  }, [autoTranslate, contentKey, hasText, isSameLanguage, normalizedText, resolvedTargetLanguage, sourceLanguage]);

  if (!hasText) {
    return null;
  }

  const showTranslated = displayMode === "translated" && Boolean(translatedText);
  const content = showTranslated ? translatedText : normalizedText;

  return (
    <div className={className}>
      <Component
        className={preserveWhitespace ? "translated-content" : undefined}
        style={preserveWhitespace ? { whiteSpace: "pre-wrap" } : undefined}
        aria-label={label || undefined}
      >
        {content}
      </Component>

      {!isSameLanguage && autoTranslate && (
        <div className="translate-actions" aria-live="polite">
          {status === "loading" && (
            <span className="translate-status">Translating…</span>
          )}

          {status === "error" && (
            <button
              type="button"
              className="translate-toggle"
              onClick={() => {
                setError("");
                setStatus("idle");
                setDisplayMode("original");
              }}
            >
              Retry
            </button>
          )}

          {translatedText && (
            <button
              type="button"
              className="translate-toggle"
              onClick={() => {
                setDisplayMode((current) => (current === "translated" ? "original" : "translated"));
              }}
            >
              {displayMode === "translated" ? "Show Original" : "Show Translation"}
            </button>
          )}

          {error ? <p className="translate-error">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
