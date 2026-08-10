"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/operator/applications", label: "Pilot Applications" },
  { href: "/operator/jobs", label: "Jobs" },
];

/**
 * Console tab bar.
 *
 * Two things it fixes beyond styling:
 *   - It is labelled. Every <nav> on the site was previously unnamed, so a
 *     screen-reader user navigating by landmark heard "navigation, navigation"
 *     with no way to tell the site nav from the console nav
 *     (audit/FINDINGS.md P1-9).
 *   - It marks the active tab with aria-current, not colour alone. No route on
 *     the site had an active-nav treatment of any kind.
 *
 * min-h-11 is 44px — WCAG 2.2 AA 2.5.8. The tab bar is the one console control
 * that is unavoidably a primary target, so it meets the floor here rather than
 * waiting for FLOORFORGE_06_responsive.patch.
 */
export default function OperatorNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Operator console" className="mx-auto max-w-7xl px-6">
      <ul className="flex gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
