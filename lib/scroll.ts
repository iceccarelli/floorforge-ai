/**
 * Smooth in-page scrolling that honours prefers-reduced-motion.
 *
 * Four call sites used `scrollIntoView({ behavior: "smooth" })` directly with
 * no guard (audit/FINDINGS.md P2-7). Smooth scrolling is exactly the kind of
 * vestibular trigger the preference exists for, and it is the one animation a
 * user cannot look away from. This helper is the only sanctioned way to scroll
 * the page.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll an element into view, instantly when motion is reduced. */
export function scrollToElement(
  target: string | Element | null,
  opts: { block?: ScrollLogicalPosition } = {}
): void {
  const el =
    typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: opts.block ?? "start",
  });
}
