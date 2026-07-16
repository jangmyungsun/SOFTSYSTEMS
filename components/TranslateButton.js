"use client";

import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "./LanguageProvider";

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
  targetLanguage,
  contentKey,
  className = "",
}) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const locale = language?.locale ?? "en";
  const resolvedTargetLanguage = targetLanguage || locale;
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);

  const normalizedOriginalText = useMemo(() => String(originalText || ""), [originalText]);
  const isSameLanguage = sourceLanguage === resolvedTargetLanguage;
  const hasText = normalizedOriginalText.trim().length > 0;

  useEffect(() => {
    setTranslatedText("");
    setError("");
    setIsShowingOriginal(false);
  }, [contentKey, normalizedOriginalText, sourceLanguage, resolvedTargetLanguage]);

  useEffect(() => {
    if (!hasText || isSameLanguage || !contentKey) {
      return;
    }

    const cached = readCache(contentKey, sourceLanguage, resolvedTargetLanguage, normalizedOriginalText);
    if (cached?.translatedText) {
      setTranslatedText(cached.translatedText);
      setIsShowingOriginal(false);
      return;
    }

    handleTranslate();
  }, [contentKey, hasText, isSameLanguage, normalizedOriginalText, resolvedTargetLanguage, sourceLanguage]);

  async function handleTranslate() {
    if (!hasText || isSameLanguage || !contentKey) {
      return;
    }

    if (normalizedOriginalText.length > MAX_TEXT_LENGTH) {
      setError(t("translate.tooLong"));
      return;
    }

    const cached = readCache(contentKey, sourceLanguage, resolvedTargetLanguage, normalizedOriginalText);
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
          targetLanguage: resolvedTargetLanguage,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.translatedText) {
        throw new Error(payload.error || t("translate.failed"));
      }

      setTranslatedText(payload.translatedText);
      writeCache(contentKey, sourceLanguage, resolvedTargetLanguage, normalizedOriginalText, payload.translatedText);
      setIsShowingOriginal(false);
    } catch (error) {
      console.error("Translation failed:", error);
      setError(error.message || t("translate.failed"));
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
        {!isSameLanguage && !translatedText ? (
          <button
            type="button"
            className="translate-toggle"
            onClick={handleTranslate}
            disabled={isLoading}
          >
            {isLoading ? t("translate.loading") : t("translate.translate")}
          </button>
        ) : null}

        {error ? <p className="translate-error">{error}</p> : null}

        {!isSameLanguage && translatedText ? (
          <button
            type="button"
            className="translate-toggle"
            onClick={handleToggle}
            disabled={isLoading}
          >
            {showTranslated ? t("translate.showOriginal") : t("translate.showTranslation")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
