"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLanguage } from "./LanguageProvider";
import { supabase } from "../lib/supabaseClient";

export default function Navigation() {
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const isAuthenticated = Boolean(session?.user);
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const locale = language?.locale ?? "en";
  const locales = language?.locales ?? ["en"];
  const links = [
    ["/", t("nav.home")],
    ["/input", t("nav.input")],
    ["/process", t("nav.process")],
    ["https://617068.cargo.site/", t("nav.output"), true],
    ["/about", t("nav.about")],
    ["/letters", t("nav.letters")],
  ];

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  return (
    <nav className="nav">
      {links.map(([href, label, external]) =>
        external ? (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {label} ↗
          </a>
        ) : (
          <Link
            key={href}
            href={href}
            className={pathname === href ? "active" : ""}
          >
            {label}
          </Link>
        )
      )}

      <label className="lang-switch" htmlFor="locale-select">
        <span className="visually-hidden">Language</span>
        <select
          id="locale-select"
          value={locale}
          onChange={(event) => language?.setLocale(event.target.value)}
          className="lang-select"
        >
          {locales.map((option) => (
            <option key={option} value={option}>
              {option.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      {isAuthenticated ? (
        <button
          type="button"
          className="nav-action"
          onClick={handleSignOut}
        >
          {t("nav.logout")}
        </button>
      ) : null}
    </nav>
  );
}
