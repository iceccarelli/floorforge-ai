"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";
import { contactHref, CONTACT_SUBJECT } from "@/lib/contact";
import { scrollToElement } from "@/lib/scroll";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#roi", label: "ROI" },
  { href: "#pricing", label: "Pricing" },
  { href: "#waitlist", label: "Pilot Program" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // The mobile menu previously animated `height: 0 -> auto`: a layout property,
  // animated on every open, on the lowest-powered devices the site has — and
  // with no prefers-reduced-motion guard at all (audit/FINDINGS.md P2-4).
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const router = useRouter();

  // Route-aware section navigation: scroll when we're already on the homepage,
  // otherwise navigate to /#section so the link works from every page (e.g.
  // /simulator, /dashboard) instead of being a dead button.
  //
  // This used to hand-roll `window.scrollTo({ behavior: "smooth" })` with a
  // literal 80px offset. Two problems, both on the primary conversion path:
  // it ignored prefers-reduced-motion (the one animation a user cannot look
  // away from — audit/FINDINGS.md P2-7), and it moved the viewport without
  // moving focus, so a keyboard user who pressed "Join waitlist" was looking
  // at the form while their next Tab went to the next item in the header.
  // lib/scroll.ts handles both, and the 80px offset it replaces is already
  // expressed as `scroll-margin-top` on every `.section` target.
  const goToSection = (hash: string) => {
    setMobileMenuOpen(false);
    if (pathname === "/") {
      scrollToElement(hash.replace(/^#/, ""));
    } else {
      router.push(`/${hash}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex min-h-11 items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <span className="text-xl font-bold tracking-[-1.5px]">FF</span>
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-[-1.2px] text-primary">FloorForge</div>
              <div className="text-[10px] text-muted-foreground -mt-1.5">EARLY ACCESS</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main" className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => goToSection(link.href)}
                className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-[14px] after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all hover:after:w-full"
              >
                {link.label}
              </button>
            ))}
            <Link
              href="/systems"
              className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground relative after:absolute after:bottom-[14px] after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all hover:after:w-full"
            >
              Systems
            </Link>
            <Link
              href="/estimator"
              className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground relative after:absolute after:bottom-[14px] after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all hover:after:w-full"
            >
              Estimator
              <span className="rounded bg-accent-light px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
                Free
              </span>
            </Link>
            <Link
              href="/report"
              className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground relative after:absolute after:bottom-[14px] after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all hover:after:w-full"
            >
              Report
            </Link>
            <Link
              href="/simulator"
              className="inline-flex min-h-11 items-center gap-1.5 text-accent transition-colors hover:text-accent-hover relative after:absolute after:bottom-[14px] after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all hover:after:w-full"
            >
              Simulator
              <span className="rounded bg-accent-light px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
                3D
              </span>
            </Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href={contactHref(CONTACT_SUBJECT)}
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-1"
            >
              Contact us
            </a>
            {authEnabled && (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="sm" className="font-medium">
                      Sign in
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="font-medium">
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8 rounded-full ring-1 ring-border"
                      }
                    }}
                  />
                </SignedIn>
              </>
            )}

            <Button
              variant="accent"
              size="sm"
              className="font-semibold px-5"
              onClick={() => goToSection("#waitlist")}
            >
              Join waitlist
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={reduce ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="lg:hidden border-t border-border bg-background"
          >
            <div id="mobile-menu" className="px-6 py-6 flex flex-col gap-4 text-sm">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => goToSection(link.href)}
                  className="flex min-h-11 items-center text-left text-muted-foreground hover:text-foreground font-medium"
                >
                  {link.label}
                </button>
              ))}
              <Link
                href="/systems"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center text-left font-medium text-muted-foreground hover:text-foreground"
              >
                Systems
              </Link>
              <Link
                href="/estimator"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center text-left font-medium text-muted-foreground hover:text-foreground"
              >
                Estimator (free tool)
              </Link>
              <Link
                href="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center text-left font-medium text-muted-foreground hover:text-foreground"
              >
                Completion report (free)
              </Link>
              <Link
                href="/simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center text-left font-medium text-accent hover:text-accent-hover"
              >
                Simulator (3D)
              </Link>
              {/* The desktop header has carried a "Contact us" affordance since
                  launch; the mobile menu never did, so on the viewport where
                  most first visits happen there was no contact route at all
                  above the footer (audit/FINDINGS.md P1-6). */}
              <a
                href={contactHref(CONTACT_SUBJECT)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center text-left font-medium text-muted-foreground hover:text-foreground"
              >
                Contact us
              </a>
              <div className="pt-4 border-t flex flex-col gap-3">
                {authEnabled && (
                  <>
                    <SignedOut>
                      <SignInButton mode="modal">
                        <Button variant="secondary" className="w-full justify-center">Sign in</Button>
                      </SignInButton>
                    </SignedOut>
                    <SignedIn>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="secondary" className="w-full justify-center">Dashboard</Button>
                      </Link>
                    </SignedIn>
                  </>
                )}
                <Button
                  variant="accent"
                  className="w-full justify-center"
                  onClick={() => goToSection("#waitlist")}
                >
                  Join waitlist
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
