"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#roi", label: "ROI" },
  { href: "#pricing", label: "Pricing" },
  { href: "#waitlist", label: "Pilot Program" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Route-aware section navigation: smooth-scroll when we're already on the
  // homepage, otherwise navigate to /#section so the link works from every
  // page (e.g. /simulator, /dashboard) instead of being a dead button.
  const goToSection = (hash: string) => {
    setMobileMenuOpen(false);
    if (pathname === "/") {
      const el = document.querySelector(hash);
      if (el) {
        const offset = 80;
        const top =
          el.getBoundingClientRect().top -
          document.body.getBoundingClientRect().top -
          offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    } else {
      router.push(`/${hash}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <span className="text-xl font-bold tracking-[-1.5px]">FF</span>
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-[-1.2px] text-primary">FloorForge</div>
              <div className="text-[10px] text-muted-foreground -mt-1.5">EARLY ACCESS</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => goToSection(link.href)}
                className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all hover:after:w-full"
              >
                {link.label}
              </button>
            ))}
            <Link
              href="/simulator"
              className="inline-flex items-center gap-1.5 text-accent transition-colors hover:text-accent-hover relative after:absolute after:bottom-[-2px] after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all hover:after:w-full"
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
              href="mailto:vince.ceccarelli@gmail.com"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-1"
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
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t bg-white"
          >
            <div className="px-6 py-6 flex flex-col gap-4 text-sm">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => goToSection(link.href)}
                  className="text-left py-2 text-muted-foreground hover:text-foreground font-medium"
                >
                  {link.label}
                </button>
              ))}
              <Link
                href="/simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-left font-medium text-accent hover:text-accent-hover"
              >
                Simulator (3D)
              </Link>
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
