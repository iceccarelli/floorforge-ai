"use client";

import React, { useEffect, useRef } from "react";

/**
 * Scroll-reveal wrapper — content-visible by default.
 *
 * WHAT WAS WRONG BEFORE (audit/FINDINGS.md P0-2)
 * ----------------------------------------------
 * The previous implementation wrapped children in a framer-motion element with
 * `initial={{ opacity: 0, y: 16 }}`. Because `/` is statically prerendered,
 * that serialised `style="opacity:0;transform:translateY(16px)"` into the
 * shipped HTML — twelve times. The `useReducedMotion()` guard only runs on the
 * client, and when it did take effect the component switched to a plain <div>
 * carrying no `style` prop, which never cleared the already-committed
 * attribute. Measured on 1440x900 after full scroll and a 1.5s settle:
 *
 *     prefers-reduced-motion: reduce      -> 12 blocks stuck at opacity 0
 *     prefers-reduced-motion: no-pref     -> 0
 *     JavaScript disabled                 -> 12 blocks, 311 of 1,356 words
 *
 * Hidden: the simulator teaser, all six capability cards, and all five workflow
 * steps — the entire product explanation. No console error was logged. It
 * failed silently.
 *
 * THE INVERSION THAT FIXES IT
 * ---------------------------
 * The hidden state is now opt-IN rather than opt-out, and it is applied by CSS
 * that cannot reach the server:
 *
 *   - The prerendered HTML has no inline style. Content is visible to a reader
 *     with JavaScript off, to a crawler that does not execute JS, and to anyone
 *     whose bundle fails to load.
 *   - `.reveal` only hides its children when <html> carries the `js` class,
 *     which app/layout.tsx adds from a render-blocking inline script — so the
 *     class is present before first paint and there is no flash.
 *   - `@media (prefers-reduced-motion: reduce)` in globals.css overrides the
 *     hidden state outright. Opting out of motion can no longer cost you the
 *     content, because the content was never conditional on the animation.
 *
 * IntersectionObserver replaces framer-motion here. That is not a stylistic
 * preference: a purely presentational fade must not be able to take the copy
 * with it when the JS layer misbehaves, and this also drops framer-motion from
 * the critical path of the homepage's largest section.
 *
 * Guard the failure mode with: node audit/scripts/reduced-motion.mjs
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Stagger, in seconds. Applied as transition-delay; ignored under reduced motion. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (old browser, some crawlers): reveal immediately.
    // The failure mode of this component is always "content is visible".
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.revealed = "true";
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -80px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : "reveal"}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
