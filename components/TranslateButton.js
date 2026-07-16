"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLanguage } from "./LanguageProvider";

const CACHE_KEY_PREFIX = "softsystems_translation_cache";
const SUPPORTED_LANGUAGES = ["en", "ko"];
const LOADING_INDICATOR_DELAY_MS = 180;
const SESSION_CACHE = new Map();
const IN_FLIGHT = new Map();

function normalizeLanguage(value, fallback = "en") {
  const text = String(value || "").toLowerCase();

  if (text.startsWith("ko")) {
    return "ko";
  }

  if (text.startsWith("en")) {
    return "en";
  }

  return fallback;
}

function isSupportedLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value);
}

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

function readSessionCache(contentKey, sourceLanguage, targetLanguage, originalText) {
  const key = getCacheKey(contentKey, sourceLanguage, targetLanguage, originalText);
  return SESSION_CACHE.get(key) || null;
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

function writeSessionCache(contentKey, sourceLanguage, targetLanguage, originalText, translatedText) {
  const key = getCacheKey(contentKey, sourceLanguage, targetLanguage, originalText);
  SESSION_CACHE.set(key, { translatedText });
}

function getStatusLabel(t, statusLabel) {
  if (!statusLabel) {
    return t("translate.articleTranslating");
  }

  const translated = t(statusLabel);
  return translated === statusLabel ? statusLabel : translated;
}

export default function TranslateButton({
  text,
  originalText,
  sourceLanguage = "en",
  targetLanguage,
  contentKey,
  autoTranslate = true,
  showStatusAbove = false,
  statusLabel = "",
  showControls = true,
  className = "",
  as = "div",
}) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const locale = normalizeLanguage(language?.locale || "en", "en");
  const resolvedTargetLanguage = normalizeLanguage(targetLanguage || locale, locale);
  const resolvedSourceLanguage = normalizeLanguage(sourceLanguage, "en");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [error, setError] = useState("");
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const requestIdRef = useRef(0);
  const loadingTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const normalizedOriginalText = useMemo(() => String(text ?? originalText ?? ""), [text, originalText]);
  const isSameLanguage = resolvedSourceLanguage === resolvedTargetLanguage;
  const hasText = normalizedOriginalText.trim().length > 0;
  const canTranslate =
    hasText &&
    Boolean(contentKey) &&
    autoTranslate &&
    !isSameLanguage &&
    isSupportedLanguage(resolvedSourceLanguage) &&
    isSupportedLanguage(resolvedTargetLanguage);

  const statusText = getStatusLabel(t, statusLabel);
  const WrapperTag = as;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    requestIdRef.current += 1;
    setTranslatedText("");
    setError("");
    setIsShowingOriginal(false);

    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    setIsLoading(false);
    setShowLoadingIndicator(false);
  }, [contentKey, normalizedOriginalText, resolvedSourceLanguage, resolvedTargetLanguage]);

  useEffect(() => {
    if (!canTranslate) {
      return;
    }

    const currentRequestId = requestIdRef.current;
    const cacheKey = getCacheKey(contentKey, resolvedSourceLanguage, resolvedTargetLanguage, normalizedOriginalText);

    const sessionCached = readSessionCache(contentKey, resolvedSourceLanguage, resolvedTargetLanguage, normalizedOriginalText);
    if (sessionCached?.translatedText) {
      setTranslatedText(sessionCached.translatedText);
      return;
    }

    const localCached = readCache(contentKey, resolvedSourceLanguage, resolvedTargetLanguage, normalizedOriginalText);

    if (localCached?.translatedText) {
      writeSessionCache(
        contentKey,
        resolvedSourceLanguage,
        resolvedTargetLanguage,
        normalizedOriginalText,
        localCached.translatedText
      );
      setTranslatedText(localCached.translatedText);
      return;
    }

    const controller = new AbortController();
    setError("");
    setIsLoading(true);
    setShowLoadingIndicator(false);

    loadingTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) {
        return;
      }

      if (requestIdRef.current !== currentRequestId) {
        return;
      }

      setShowLoadingIndicator(true);
    }, LOADING_INDICATOR_DELAY_MS);

    const existingPromise = IN_FLIGHT.get(cacheKey);

    const promise =
      existingPromise ||
      fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentKey,
          originalText: normalizedOriginalText,
          sourceLanguage: resolvedSourceLanguage,
          targetLanguage: resolvedTargetLanguage,
        }),
        signal: controller.signal,
      })
        .then((response) =>
          response.json().catch(() => ({})).then((payload) => ({ response, payload }))
        )
        .finally(() => {
          IN_FLIGHT.delete(cacheKey);
        });

    if (!existingPromise) {
      IN_FLIGHT.set(cacheKey, promise);
    }

    promise
      .then(({ response, payload }) => {
        if (!mountedRef.current || requestIdRef.current !== currentRequestId) {
          return;
        }

        if (!response?.ok || !payload?.translatedText) {
          throw new Error(payload?.error || "Translation failed.");
        }

        setTranslatedText(payload.translatedText);
        writeSessionCache(contentKey, resolvedSourceLanguage, resolvedTargetLanguage, normalizedOriginalText, payload.translatedText);
        writeCache(contentKey, resolvedSourceLanguage, resolvedTargetLanguage, normalizedOriginalText, payload.translatedText);
      })
      .catch((translateError) => {
        if (controller.signal.aborted) {
          return;
        }

        if (!mountedRef.current || requestIdRef.current !== currentRequestId) {
          return;
        }

        setError(translateError?.message || t("translate.failed"));
      })
      .finally(() => {
        if (!mountedRef.current || requestIdRef.current !== currentRequestId) {
          return;
        }

        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }

        setIsLoading(false);
        setShowLoadingIndicator(false);
      });

    return () => {
      controller.abort();
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setShowLoadingIndicator(false);
      setIsLoading(false);
    };
  }, [
    autoTranslate,
    canTranslate,
    contentKey,
    normalizedOriginalText,
    retryToken,
    resolvedSourceLanguage,
    resolvedTargetLanguage,
  ]);

  async function handleRetry() {
    if (!canTranslate) {
      return;
    }

    requestIdRef.current += 1;
    setTranslatedText("");
    setError("");
    setIsShowingOriginal(false);
    setRetryToken((value) => value + 1);
  }

  function handleToggle() {
    if (!canTranslate || !translatedText) {
      return;
    }

    setIsShowingOriginal((current) => !current);
    setError("");
  }

  const showTranslated = !isShowingOriginal && translatedText;

  const controls = (
    <div className="translate-actions">
      {showControls && showLoadingIndicator ? (
        <p className="translate-status" aria-live="polite">
          {statusText}
        </p>
      ) : null}

      {showControls && error ? (
        <div className="translate-status translate-status-error" aria-live="polite">
          <span>{t("translate.unavailableShowingOriginal")}</span>
          <button type="button" className="translate-toggle" onClick={handleRetry} disabled={isLoading}>
            {t("translate.retry")}
          </button>
        </div>
      ) : null}

      {showControls && canTranslate && translatedText && !showLoadingIndicator && !error ? (
        <div className="translate-status translate-status-ready" aria-live="polite">
          <span>{showTranslated ? t("translate.translation") : t("translate.original")}</span>
          <button type="button" className="translate-toggle" onClick={handleToggle} disabled={isLoading}>
            {showTranslated ? t("translate.showOriginal") : t("translate.showTranslation")}
          </button>
        </div>
      ) : null}
    </div>
  );

  const content = showTranslated ? translatedText : normalizedOriginalText || "";

  return (
    <WrapperTag className={className}>
      {showStatusAbove ? controls : null}

      <div className="translate-content">
        <span className={showTranslated ? "translated-content" : "original-content"}>{content}</span>
      </div>

      {!showStatusAbove ? controls : null}
    </WrapperTag>
  );
}
