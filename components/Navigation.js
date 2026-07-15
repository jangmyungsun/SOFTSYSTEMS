"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/", "Home"],
  ["/input", "Input"],
  ["/process", "Process"],
  ["https://617068.cargo.site/", "Output", true],
  ["/about", "About"],
  ["/letters", "Visitor Letters"],
  ["/login", "Login"],
];

export default function Navigation() {
  const pathname = usePathname();

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
    </nav>
  );
}
