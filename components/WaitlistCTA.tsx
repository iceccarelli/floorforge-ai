"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, ArrowRight } from "lucide-react";

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;
const CONTACT_EMAIL = "vince.ceccarelli@gmail.com";

/**
 * The single honest conversion path on the site. Posts to Formspree when
 * NEXT_PUBLIC_FORMSPREE_FORM_ID is set; otherwise falls back to mailto so
 * the CTA is never a dead button.
 */
export default function WaitlistCTA() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [volume, setVolume] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
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

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center p-10 rounded-2xl border-2 border-accent/30 bg-white">
        <div className="text-2xl font-semibold tracking-tight mb-2">You&apos;re on the list.</div>
        <p className="text-muted-foreground">
          Thanks for your interest in the FloorForge pilot. We&apos;ll reach out as the
          program takes shape.
        </p>
      </div>
    );
  }

  if (!FORMSPREE_ID) {
    // No form backend configured — honest mailto fallback, never a dead CTA.
    return (
      <div className="max-w-xl mx-auto text-center">
        <a href={`mailto:${CONTACT_EMAIL}?subject=FloorForge%20pilot%20waitlist`}>
          <Button variant="accent" size="lg" className="h-14 px-10 text-base">
            <Mail className="mr-2 h-4 w-4" /> Email us to join the pilot waitlist
          </Button>
        </a>
        <div className="mt-3 text-xs text-muted-foreground">
          Tell us your typical monthly refinishing volume and market.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto card p-8 md:p-10 bg-white border-2 border-slate-200">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
            NAME
          </label>
          <input
            className="input h-11 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
            WORK EMAIL *
          </label>
          <input
            className="input h-11 w-full"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@yourcompany.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
            COMPANY
          </label>
          <input
            className="input h-11 w-full"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Refinishing Co."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
            MONTHLY REFINISHING VOLUME (SQFT)
          </label>
          <input
            className="input h-11 w-full"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            placeholder="e.g. 25,000"
          />
        </div>
      </div>
      <Button
        variant="accent"
        className="mt-6 w-full h-12"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Submitting…" : "Join the pilot waitlist"}
        {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
      <div className="mt-3 text-center text-xs text-muted-foreground">
        No spam. We&apos;ll contact you about the pilot program only.
      </div>
    </div>
  );
}
