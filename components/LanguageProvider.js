"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getInitialLocale, getSupportedLocales, setLocalePreference, t as translate } from "../lib/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const initialLocale = getInitialLocale();
    setLocale(initialLocale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = initialLocale;
    }
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
