"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { contactHref, WAITLIST_SUBJECT } from "@/lib/contact";
import { submitToPilotApi, FIELD_TO_INPUT } from "@/lib/waitlist";

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;
const hasFormBackend = Boolean(FORMSPREE_ID);

/**
 * The single conversion path on the site, submitting to FloorForge's own lead
 * pipeline first.
 *
 * Three tiers, in order (lib/waitlist.ts documents why):
 *   1. POST /api/applications — the pipeline this company already built. A lead
 *      lands in the operator console at /operator/applications with status
 *      "new" and enters the ten-state lifecycle in lib/types.ts:63.
 *   2. Formspree — only if NEXT_PUBLIC_FORMSPREE_FORM_ID is set.
 *   3. A prefilled mailto the prospect sends themselves.
 *
 * The CTA is never dead at any tier (mission Part II.2), and no tier tells the
 * prospect they are on a list they are not on: the mailto confirmation says
 * "drafted", because that is what happened.
 *
 * Validation errors come back from the API and are rendered inline against the
 * field they belong to, so the client holds no second copy of the rules.
  */
export default function WaitlistCTA() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [volume, setVolume] = useState("");
  const [interest, setInterest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [composeHref, setComposeHref] = useState<string | null>(null);

  // Read ?interest=<platform> passed from the simulator CTA. Done via a
  // client effect (not useSearchParams) so the homepage stays static.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("interest");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value) setInterest(value);
  }, []);

  /** Shared a11y wiring so every field reports its error the same way. */
  const errorProps = (id: string) =>
    errors[id]
      ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` }
      : {};

  const clearError = (id: string) =>
    setErrors((prev) => (prev[id] ? { ...prev, [id]: "" } : prev));

  // A render function, not a component: defining a component inside render
  // trips react-hooks/static-components and remounts the node on every keystroke,
  // which would re-announce the error to a screen reader each time.
  const fieldError = (id: string) =>
    errors[id] ? (
      <p
        id={`${id}-error`}
        role="alert"
        className="mt-1.5 text-xs font-medium text-[color:var(--status-bad-ink)]"
      >
        {errors[id]}
      </p>
    ) : null;

  /** Tier 3: the prospect sends the message themselves. Never a dead CTA. */
  const composeEmail = () => {
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
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrors({});

    // One local check, kept because it is the only one worth making before a
    // round trip: an address with no "@" cannot succeed anywhere.
    if (!email.trim() || !email.includes("@")) {
      setErrors({ "waitlist-email": "Enter a work email address so we can reply." });
      document.getElementById("waitlist-email")?.focus();
      return;
    }

    setSubmitting(true);
    try {
      // Tier 1 — FloorForge's own pipeline. A lead that lands here appears in
      // the operator console at /operator/applications with status "new" and
      // enters the ten-state lifecycle the product already models.
      const result = await submitToPilotApi({ name, email, company, volume, interest });

      if (result.kind === "created") {
        setSubmitted(true);
        toast.success("You're on the pilot waitlist. We'll be in touch.");
        return;
      }

      if (result.kind === "invalid") {
        // The API's own field errors, rendered inline. No second copy of the
        // validation rules on the client to drift out of sync with the server.
        const mapped: Record<string, string> = {};
        for (const err of result.errors) {
          const inputId = FIELD_TO_INPUT[err.field];
          if (inputId) mapped[inputId] = err.message;
        }
        if (Object.keys(mapped).length === 0) {
          mapped["waitlist-email"] = result.errors[0]?.message ?? "Please check your details.";
        }
        setErrors(mapped);
        document.getElementById(Object.keys(mapped)[0])?.focus();
        return;
      }

      // Tier 2 — Formspree, only if it was ever configured.
      if (hasFormBackend) {
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
        if (res.ok) {
          setSubmitted(true);
          toast.success("You're on the pilot waitlist. We'll be in touch.");
          return;
        }
      }

      // Tier 3.
      composeEmail();
    } catch {
      composeEmail();
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
            onChange={(e) => {
              setName(e.target.value);
              clearError("waitlist-name");
            }}
            {...errorProps("waitlist-name")}
            placeholder="Jane Doe"
          />
          {fieldError("waitlist-name")}
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
              clearError("waitlist-email");
            }}
            {...errorProps("waitlist-email")}
            placeholder="jane@yourcompany.com"
          />
          {fieldError("waitlist-email")}
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
            onChange={(e) => {
              setCompany(e.target.value);
              clearError("waitlist-company");
            }}
            {...errorProps("waitlist-company")}
            placeholder="Refinishing Co."
          />
          {fieldError("waitlist-company")}
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
            onChange={(e) => {
              setVolume(e.target.value);
              clearError("waitlist-volume");
            }}
            {...errorProps("waitlist-volume")}
            placeholder="e.g. 25,000"
          />
          {fieldError("waitlist-volume")}
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
