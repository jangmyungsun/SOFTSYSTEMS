"use client";

import { useEffect, useMemo, useState } from "react";

const CACHE_KEY_PREFIX = "softsystems_translation_cache";
const MAX_TEXT_LENGTH = 4000;

function getCacheKey(contentKey, sourceLanguage, targetLanguage, originalText) {
  return `${CACHE_KEY_PREFIX}:${contentKey}:${sourceLanguage}:${targetLanguage}:${originalText}`;
}

function readCache(contentKey, sourceLanguage, targetLanguage, originalText) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const key = getCacheKey(contentKey, sourceLanguage, targetLanguage, originalText);
    const value = window.localStorage.getItem(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function writeCache(contentKey, sourceLanguage, targetLanguage, originalText, translatedText) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = getCacheKey(contentKey, sourceLanguage, targetLanguage, originalText);
    window.localStorage.setItem(key, JSON.stringify({ translatedText }));
  } catch (error) {
    // ignore cache write failures
  }
}

export default function TranslateButton({
  originalText,
  sourceLanguage = "en",
  targetLanguage = "ko",
  contentKey,
  className = "",
}) {
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isShowingOriginal, setIsShowingOriginal] = useState(true);

  const normalizedOriginalText = useMemo(() => String(originalText || ""), [originalText]);
  const isSameLanguage = sourceLanguage === targetLanguage;
  const hasText = normalizedOriginalText.trim().length > 0;

  useEffect(() => {
    setTranslatedText("");
    setError("");
    setIsShowingOriginal(true);
  }, [contentKey, normalizedOriginalText, sourceLanguage, targetLanguage]);

  useEffect(() => {
    if (!hasText || isSameLanguage || !contentKey) {
      return;
    }

    const cached = readCache(contentKey, sourceLanguage, targetLanguage, normalizedOriginalText);
    if (cached?.translatedText) {
      setTranslatedText(cached.translatedText);
      setIsShowingOriginal(true);
    }
  }, [contentKey, hasText, isSameLanguage, normalizedOriginalText, sourceLanguage, targetLanguage]);

  async function handleTranslate() {
    if (!hasText || isSameLanguage || !contentKey) {
      return;
    }

    if (normalizedOriginalText.length > MAX_TEXT_LENGTH) {
      setError("The selected text is too long to translate right now.");
      return;
    }

    const cached = readCache(contentKey, sourceLanguage, targetLanguage, normalizedOriginalText);
    if (cached?.translatedText) {
      setTranslatedText(cached.translatedText);
      setIsShowingOriginal(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentKey,
          originalText: normalizedOriginalText,
          sourceLanguage,
          targetLanguage,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.translatedText) {
        throw new Error(payload.error || "Translation failed.");
      }

      setTranslatedText(payload.translatedText);
      writeCache(contentKey, sourceLanguage, targetLanguage, normalizedOriginalText, payload.translatedText);
      setIsShowingOriginal(false);
    } catch (error) {
      console.error("Translation failed:", error);
      setError(error.message || "Translation failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleToggle() {
    if (isSameLanguage) {
      return;
    }

    if (!translatedText) {
      return;
    }

    setIsShowingOriginal((current) => !current);
    setError("");
  }

  const showTranslated = !isShowingOriginal && translatedText;

  return (
    <div className={className}>
      <div className="translate-content">
        {showTranslated ? (
          <div className="translated-content">{translatedText}</div>
        ) : (
          <div className="original-content">{normalizedOriginalText || ""}</div>
        )}
      </div>

      <div className="translate-actions">
        {!isSameLanguage && (
          <button
            type="button"
            className="translate-toggle"
            onClick={showTranslated ? handleToggle : handleTranslate}
            disabled={isLoading}
          >
            {isLoading ? "Translating…" : showTranslated ? "Show Original" : "Translate"}
          </button>
        )}

        {error ? <p className="translate-error">{error}</p> : null}
      </div>
    </div>
  );
}
