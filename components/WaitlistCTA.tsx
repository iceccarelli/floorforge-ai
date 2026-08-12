"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { contactHref, WAITLIST_SUBJECT } from "@/lib/contact";

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;
const hasFormBackend = Boolean(FORMSPREE_ID);

/**
 * The single honest conversion path on the site. Posts to Formspree when
 * NEXT_PUBLIC_FORMSPREE_FORM_ID is set; otherwise composes the same fields
 * into a prefilled email, so the CTA is never a dead button.
 *
 * Why the fallback changed (audit/FINDINGS.md P1-6, mission II.2):
 * production does not currently have NEXT_PUBLIC_FORMSPREE_FORM_ID set, which
 * means the fallback *is* the live conversion path — and the old fallback threw
 * the form away entirely, replacing it with a single "Email us" button. Every
 * prospect landed in a blank compose window and had to work out for themselves
 * what to say; the company, volume and interest fields that qualify the lead
 * were simply never asked for. The fields now render in both modes and the
 * fallback packs them into the message body.
 *
 * This does not make the mailto path as good as a real form backend. Setting
 * NEXT_PUBLIC_FORMSPREE_FORM_ID in Vercel remains the single highest-value
 * action available on this site, and it is a configuration change no patch can
 * make. This narrows the gap; it does not close it.
 */
export default function WaitlistCTA() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [volume, setVolume] = useState("");
  const [interest, setInterest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [composeHref, setComposeHref] = useState<string | null>(null);

  // Read ?interest=<platform> passed from the simulator CTA. Done via a
  // client effect (not useSearchParams) so the homepage stays static.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("interest");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value) setInterest(value);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      // Inline AND announced. A toast disappears, is never associated with the
      // field, and is invisible to anyone who has scrolled (FINDINGS P2-2).
      setEmailError("Enter a work email address so we can reply.");
      document.getElementById("waitlist-email")?.focus();
      toast.error("Please enter a valid email address.");
      return;
    }
    setEmailError(null);

    if (!hasFormBackend) {
      // No form backend configured. Compose the same payload as an email the
      // prospect sends themselves. Labelled as exactly that on the button, so
      // nobody thinks they have submitted something they have not.
      const lines = [
        `Name: ${name.trim() || "—"}`,
        `Work email: ${email.trim()}`,
        `Company: ${company.trim() || "—"}`,
        `Monthly refinishing volume (sqft): ${volume.trim() || "—"}`,
        `Interested in: ${interest || "the pilot program generally"}`,
        "",
        "I'd like to join the FloorForge pilot waitlist.",
      ];
      const href = contactHref(WAITLIST_SUBJECT, lines.join("\n"));
      setComposeHref(href);
      window.location.href = href;
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          monthly_sqft: volume,
          interest: interest || "general",
          source: "floorforge-pilot-waitlist",
        }),
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      setSubmitted(true);
      toast.success("You're on the pilot waitlist. We'll be in touch.");
    } catch {
      toast.error("Submission failed. Please email us directly instead.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && composeHref) {
    // Mailto path. The message is drafted, not sent — saying "you're on the
    // list" here would be a lie, and it is the kind of lie that loses the lead
    // silently, because the prospect closes the tab believing they are done.
    return (
      <div role="status" className="max-w-xl mx-auto text-center p-10 rounded-2xl border-2 border-accent/30 bg-card">
        <div className="text-2xl font-semibold tracking-tight mb-2">
          Your email is drafted.
        </div>
        <p className="text-muted-foreground">
          We&apos;ve opened your email client with the details filled in. Send that
          message and you&apos;re on the pilot waitlist.
        </p>
        <div className="mt-5">
          {/* asChild, not a nested <button> inside an <a>: that is invalid HTML,
              and the anchor — not the button — is what the browser sized, giving
              this a 21px tall hit area (audit/FINDINGS.md P1-5, P2-1). */}
          <Button asChild variant="secondary" className="h-12 px-6">
            <a href={composeHref}>Didn&apos;t open? Draft it again</a>
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div role="status" className="max-w-xl mx-auto text-center p-10 rounded-2xl border-2 border-accent/30 bg-card">
        <div className="text-2xl font-semibold tracking-tight mb-2">You&apos;re on the list.</div>
        <p className="text-muted-foreground">
          Thanks for your interest in the FloorForge pilot. We&apos;ll reach out as the
          program takes shape.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto card p-8 md:p-10 bg-card border-2 border-border-strong">
      {interest && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-light px-3 py-2 text-sm text-foreground">
          <span className="font-semibold text-accent">Interested in:</span>
          {interest}
        </div>
      )}
      {/* A real <form>: Enter now submits, which it did not before — a keyboard
          user had to Tab to the button. onSubmit also gives the browser its
          native validation hooks back (audit/FINDINGS.md P2-2). */}
      <form onSubmit={handleSubmit} noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="waitlist-name"
            className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
          >
            NAME
          </label>
          <input
            id="waitlist-name"
            className="input min-h-11 w-full text-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label
            htmlFor="waitlist-email"
            className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
          >
            WORK EMAIL <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="waitlist-email"
            className="input min-h-11 w-full text-base"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "waitlist-email-error" : undefined}
            placeholder="jane@yourcompany.com"
          />
          {emailError && (
            <p
              id="waitlist-email-error"
              role="alert"
              className="mt-1.5 text-xs font-medium text-[color:var(--status-bad-ink)]"
            >
              {emailError}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="waitlist-company"
            className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
          >
            COMPANY
          </label>
          <input
            id="waitlist-company"
            className="input min-h-11 w-full text-base"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Refinishing Co."
          />
        </div>
        <div>
          <label
            htmlFor="waitlist-volume"
            className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
          >
            MONTHLY REFINISHING VOLUME (SQFT)
          </label>
          <input
            id="waitlist-volume"
            className="input min-h-11 w-full text-base"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            placeholder="e.g. 25,000"
          />
        </div>
      </div>
      <Button
        type="submit"
        variant="accent"
        className="mt-6 w-full h-12"
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting
          ? "Submitting…"
          : hasFormBackend
            ? "Join the pilot waitlist"
            : "Draft my pilot waitlist email"}
        {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
      <div className="mt-3 text-center text-xs text-muted-foreground">
        {hasFormBackend
          ? "No spam. We'll contact you about the pilot program only."
          : "Opens your email client with these details filled in. Nothing is sent until you press send."}
      </div>
      </form>
    </div>
  );
}
