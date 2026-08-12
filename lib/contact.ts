/**
 * Single source of truth for the outbound contact address.
 *
 * Before this file the same address was hardcoded in four places
 * (`Header.tsx`, `Footer.tsx` ×2, `WaitlistCTA.tsx`) and a fifth time inside
 * the JSON-LD `Organization` node (`StructuredData.tsx`). Four copies of a
 * string that is going to change is four chances to change three of them.
 *
 * Per audit/FINDINGS.md P1-6 the address itself is a credibility problem on a
 * B2B site quoting $799/mo: a personal Gmail reads as "there is no company
 * here yet". That is the owner's call, not this patch's, and the owner has
 * chosen to keep it for now. What this file changes is the *cost* of that
 * decision later — swapping in `pilot@floorforge.ai` is now a one-line edit
 * here, and every CTA, the mailto fallback and the structured data follow.
 */
export const CONTACT_EMAIL = "vince.ceccarelli@gmail.com";

/**
 * Build a `mailto:` href with the subject (and optionally body) prefilled.
 *
 * A bare `mailto:` opens an empty compose window with no subject, which puts
 * the whole burden of explaining themselves on the prospect and produces an
 * inbox where nothing is sortable. Prefilling costs nothing and is the
 * difference between "hi" and a routable, qualified message.
 */
export function contactHref(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  // URLSearchParams encodes spaces as "+", which some mail clients render
  // literally in the subject line. Percent-encoding is what mailto expects.
  return `mailto:${CONTACT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
}

/** Subject line used by every general "Contact us" affordance. */
export const CONTACT_SUBJECT = "FloorForge enquiry";

/** Subject line used by the pilot waitlist path. */
export const WAITLIST_SUBJECT = "FloorForge pilot waitlist";
