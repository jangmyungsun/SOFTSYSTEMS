"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { supabase } from "../lib/supabaseClient";

const links = [
  ["/", "Home"],
  ["/input", "Input"],
  ["/process", "Process"],
  ["https://617068.cargo.site/", "Output", true],
  ["/about", "About"],
  ["/letters", "Visitor Letters"],
];

export default function Navigation() {
  const pathname = usePathname();
  const [session, setSession] = useState(null);

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

      {session ? (
        <button
          type="button"
          className="nav-action"
          onClick={handleSignOut}
        >
          Logout
        </button>
      ) : null}
    </nav>
  );
}
