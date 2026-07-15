"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/",
    label: "Home",
  },

  {
    href: "/input",
    label: "Input",
  },

  {
    href: "/process",
    label: "Process",
  },

  {
    href: "https://617068.cargo.site/",
    label: "Output ↗",
    external: true,
  },

  {
    href: "/about",
    label: "About",
  },

  {
    href: "/login",
    label: "Login",
  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {links.map((link) => {
        if (link.external) {
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          );
        }

        const active =
          pathname === link.href ||
          (link.href !== "/" &&
            pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active ? "active" : ""
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
