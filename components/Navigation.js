"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/", "Home"],
  ["/input", "Input"],
  ["/process", "Process"],
  ["/output", "Output"],
  ["/about", "About"],
  ["/letters", "Visitor Letters"],
  ["/login", "Login"],
];

export default function Navigation() {
  const pathname =
    usePathname();

  return (
    <nav className="nav">
      {links.map(
        ([href, label]) => (
          <Link
            key={href}
            href={href}
            className={
              pathname === href
                ? "active"
                : ""
            }
          >
            {label}
          </Link>
        )
      )}
    </nav>
  );
}