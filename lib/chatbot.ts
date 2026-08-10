/**
 * Opening the assistant from elsewhere on the page.
 *
 * Two CTAs previously did this:
 *
 *     document.querySelector('[aria-label="Open FloorForge Assistant"]')?.click()
 *
 * which couples a marketing button to the exact wording of an accessibility
 * label. Rewording that label for screen-reader users — a change nobody would
 * think to test a CTA against — silently kills both buttons, with no error
 * (audit/FINDINGS.md P2-6).
 *
 * The contract is now an explicit data attribute. It is still DOM-level rather
 * than React state, because the chatbot mounts as a sibling of the sections
 * that open it; making it shared state is patch 04's job. But the handle is now
 * something you cannot rename by accident: grep for CHATBOT_TRIGGER_ATTR.
 */
export const CHATBOT_TRIGGER_ATTR = "data-chatbot-launcher";

/** Opens the assistant. Returns false if the launcher is not mounted. */
export function openChatbot(): boolean {
  const el = document.querySelector<HTMLButtonElement>(
    `[${CHATBOT_TRIGGER_ATTR}]`
  );
  if (!el) return false;
  el.click();
  return true;
}
