"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  getBrowserLocaleValue,
  getLocaleFromCountryCode,
  getLocaleFromStorage,
  getSupportedLocales,
  setLocalePreference,
  t as translate,
} from "../lib/i18n";

const LanguageContext = createContext(null);
const DEFAULT_LOCALE = "en";

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    let isCancelled = false;

    setIsHydrated(true);

    async function resolveCountryLocale() {
      try {
        const response = await fetch("/api/locale", {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const resolvedLocale =
          getLocaleFromCountryCode(data?.country) || DEFAULT_LOCALE;

        if (isCancelled) {
          return;
        }

        setLocale(resolvedLocale);
      } catch (error) {
        // ignore unavailable locale detection
      }
    }

    const storedLocale = getLocaleFromStorage();
    if (storedLocale) {
      setLocale(storedLocale);
      return () => {
        isCancelled = true;
      };
    }

    const browserLocale = getBrowserLocaleValue();
    if (browserLocale) {
      setLocale(browserLocale);
      return () => {
        isCancelled = true;
      };
    }

    resolveCountryLocale();

    return () => {
      isCancelled = true;
    };
  }, []);

  const value = useMemo(() => ({
    locale,
    isHydrated,
    setLocale: (nextLocale) => {
      const normalized = setLocalePreference(nextLocale);
      setLocale(normalized);
    },
    t: (key, params) => translate(locale, key, params),
    locales: getSupportedLocales(),
  }), [isHydrated, locale]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
