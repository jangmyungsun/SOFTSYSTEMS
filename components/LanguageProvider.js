"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  getBrowserLocaleValue,
  getInitialLocale,
  getLocaleFromCountryCode,
  getLocaleFromStorage,
  getSupportedLocales,
  setLocalePreference,
  t as translate,
} from "../lib/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => getInitialLocale());

  useEffect(() => {
    const initialLocale = getInitialLocale();
    setLocale(initialLocale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = initialLocale;
    }

    if (getLocaleFromStorage()) {
      return;
    }

    if (getBrowserLocaleValue()) {
      return;
    }

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
        const resolvedLocale = getLocaleFromCountryCode(data?.country) || "en";

        setLocale(resolvedLocale);
        if (typeof document !== "undefined") {
          document.documentElement.lang = resolvedLocale;
        }
      } catch (error) {
        // ignore unavailable locale detection
      }
    }

    resolveCountryLocale();
  }, []);

  const value = useMemo(() => ({
    locale,
    setLocale: (nextLocale) => {
      const normalized = setLocalePreference(nextLocale);
      setLocale(normalized);
      if (typeof document !== "undefined") {
        document.documentElement.lang = normalized;
      }
    },
    t: (key, params) => translate(locale, key, params),
    locales: getSupportedLocales(),
  }), [locale]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
