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

/**
 * Scroll an element into view, instantly when motion is reduced, and move
 * focus to it.
 *
 * The focus half matters as much as the scroll half. Every in-page CTA on this
 * site is a `<button>` that moves the viewport; focus stayed on the button, so
 * a keyboard user who pressed "Join the pilot waitlist" was moved to the
 * waitlist form visually while their next Tab went to the *next item in the
 * header*. A screen-reader user got no announcement that anything had happened
 * at all. Both are the same defect: the button moved the page but not the user.
 *
 * The target gets `tabindex="-1"` so it can receive programmatic focus without
 * entering the tab order, and `data-scroll-target` so globals.css can suppress
 * the focus ring on what is a landing region, not a control. Pass
 * `{ focus: false }` for scrolls that are not navigation.
 */
export function scrollToElement(
  target: string | Element | null,
  opts: { block?: ScrollLogicalPosition; focus?: boolean } = {}
): void {
  const el =
    typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: opts.block ?? "start",
  });
  if (opts.focus === false) return;
  if (!(el instanceof HTMLElement)) return;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.setAttribute("data-scroll-target", "");
  // preventScroll: the scrollIntoView above already owns the movement, and
  // letting focus() scroll too would cancel the smooth behaviour with a jump.
  el.focus({ preventScroll: true });
}
