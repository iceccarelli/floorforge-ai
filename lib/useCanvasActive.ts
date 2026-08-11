"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Is a WebGL canvas actually worth rendering right now?
 *
 * React Three Fiber's default `frameloop="always"` runs requestAnimationFrame
 * forever: while the canvas is scrolled off-screen, and in some browsers while
 * the tab is in the background. On a phone that is a battery drain a visitor
 * cannot see the point of, and it competes with the main thread for INP
 * (audit/FINDINGS.md §6 — "pauses when off-screen or the tab is hidden: No").
 *
 * Returns true only when the element is intersecting the viewport AND the
 * document is visible. Pass the result to <Canvas frameloop={...}>: "always"
 * when active, "demand" when not — "demand" still renders on explicit
 * invalidate(), so the canvas is never blank, it just stops burning frames.
 *
 * Fails open: no IntersectionObserver, or no ref attached, means active.
 */
export function useCanvasActive<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(true);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, active: visible && onScreen };
}
