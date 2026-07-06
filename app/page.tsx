"use client";

import React from "react";
import {
  Zap, Shield, Target, Layers, Bot, BarChart3,
  CheckCircle, ArrowRight, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ROICalculator from "@/components/ROICalculator";
import Chatbot from "@/components/Chatbot";
import WaitlistCTA from "@/components/WaitlistCTA";
import Reveal from "@/components/Reveal";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const features = [
  {
    icon: Zap,
    title: "Autonomous Multi-Grit Sanding",
    description:
      "Designed around real-time load sensing and species detection, executing 36→180 grit sequences with consistent pressure and pass overlap — the same cut, every pass, every job.",
  },
  {
    icon: Target,
    title: "Semi-Autonomous Edging",
    description:
      "LiDAR and vision-based edge detection targeting baseboards, transitions, and complex perimeters, with a human-oversight mode to minimize hand work.",
  },
  {
    icon: Layers,
    title: "Consistent Finish Application",
    description:
      "T-bar and robotic spray modes with live viscosity and ambient monitoring, targeting uniform sheen and film build across the whole floor.",
  },
  {
    icon: Shield,
    title: "Dust Containment & Reporting",
    description:
      "Designed around HEPA filtration with cyclonic pre-separation and per-job airborne particulate logging, so dust performance is documented, not promised.",
  },
  {
    icon: Bot,
    title: "One Operating System",
    description:
      "A shared planning, fleet, and quality-scoring layer — one source of truth for every job, designed to extend across future Forge products for the rest of the interior.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Operations",
    description:
      "Every pass, dust reading, and finish measurement logged. Post-job reports and trend analysis, so you know exactly where margin is made or lost.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Site Capture & Digital Twin",
    desc: "A rapid LiDAR + photogrammetry scan generates an optimized multi-pass plan tailored to species, condition, and desired finish.",
  },
  {
    step: "02",
    title: "Autonomous Field Sanding",
    desc: "Robots execute the coordinated grit sequence with adaptive pressure and speed, while edge units work the perimeter in parallel.",
  },
  {
    step: "03",
    title: "Precision Edging & Detail",
    desc: "A semi-autonomous edging pass with a human-oversight option handles transitions, vents, and built-ins with minimal rework.",
  },
  {
    step: "04",
    title: "Finish Application",
    desc: "T-bar or precision spray application with environmental sensors monitoring cure conditions and film build in real time.",
  },
  {
    step: "05",
    title: "Quality Report & Analytics",
    desc: "A complete digital record — grit logs, dust metrics, finish uniformity, photos — ready to share with the GC or property manager.",
  },
];

const segments = [
  {
    title: "High-End Residential",
    desc: "Single-family refinishing where turnover speed, dust control inside occupied homes, and callback-free finishes decide who gets the referral.",
  },
  {
    title: "Commercial Office & Retail",
    desc: "Large multi-floor projects where edge-to-edge consistency, night-shift scheduling around occupancy, and documented quality win repeat GC business.",
  },
  {
    title: "Historic & Specialty",
    desc: "Heart pine, walnut, and delicate species where gentle start sequences and adaptive pressure protect character while delivering modern performance.",
  },
];

const techHighlights = [
  "Low-profile autonomous sanders (target: under 8\" for door clearance)",
  "HEPA + cyclonic pre-separation dust systems",
  "Edge-sensing LiDAR + high-resolution vision array",
  "Onboard species & moisture detection",
  "Shared planning & fleet software layer",
  "Offline-capable with cloud sync",
];

export default function FloorForgeLanding() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative pt-16 pb-20 md:pt-20 md:pb-24 border-b">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1 text-xs font-medium tracking-[1.5px] mb-6">
            EARLY STAGE — PILOT PROGRAM FORMING
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] mb-6">
            Autonomous Sanding and Finishing<br />for Hardwood Floors.
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-muted-foreground tracking-[-0.3px] mb-10">
            FloorForge is the operating system we&apos;re building for autonomous floor
            refinishing — job planning, multi-grit sanding orchestration, edging
            assistance, and finish application with full dust and quality reporting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="accent"
              size="lg"
              className="text-base px-9 h-14"
              onClick={() => scrollTo("waitlist")}
            >
              Join the pilot waitlist
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="text-base px-8 h-14 group"
              onClick={() => scrollTo("how-it-works")}
            >
              <ArrowDown className="mr-2 h-4 w-4 group-hover:translate-y-0.5 transition" />
              See how it works
            </Button>
          </div>

          <div className="mt-8 text-xs text-muted-foreground flex items-center justify-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
            In active development. Pilot crews help shape the product.
          </div>
        </div>
      </section>

      {/* CAPABILITY PILLARS BAR */}
      <section className="stats-bar py-5 text-white/90 text-sm">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-center md:justify-between gap-x-8 gap-y-3 text-center md:text-left">
          <div>Built for crews who refuse to lose bids to inconsistency</div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 text-xs md:text-sm font-medium tracking-wider">
            <div>MULTI-GRIT AUTOMATION</div>
            <div>EDGE INTELLIGENCE</div>
            <div>DUST REPORTING</div>
            <div>UNIFIED FLEET OS</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center mb-14">
          <div className="text-accent text-xs tracking-[3px] font-semibold mb-3">WHAT WE&apos;RE BUILDING</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">Everything a refinishing operation needs.</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Inconsistent sanding and callbacks burn margin. FloorForge is designed to
            turn every job into a predictable, documented operation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={index} delay={index * 0.06}>
              <div className="card p-8 group">
                <div className="feature-icon mb-6 group-hover:scale-105 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-2xl tracking-tight mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section bg-muted py-20 border-y">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <div className="text-accent text-xs tracking-[3px] font-semibold mb-2">THE PLANNED WORKFLOW</div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">From scan to sign-off.</h2>
            </div>
            <p className="mt-4 md:mt-0 max-w-md text-muted-foreground">
              One software core for planning, execution, and reporting — designed to
              extend to the rest of the interior over time.
            </p>
          </div>

          <div className="space-y-4">
            {howItWorks.map((step, index) => (
              <Reveal key={index} delay={index * 0.06}>
              <div className="card p-8 md:p-9 flex flex-col md:flex-row gap-8 md:gap-12 items-start group">
                <div className="font-mono text-6xl font-semibold text-accent/70 tracking-[-3px] w-20 flex-shrink-0">{step.step}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-2xl tracking-tight mb-3 group-hover:text-accent transition-colors">{step.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ROI MODEL */}
      <section id="roi" className="section max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-accent text-xs tracking-[3px] font-semibold mb-3">MODEL THE ECONOMICS</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold mb-4">What could automation change for your jobs?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Adjust the model to your typical job. All outputs are estimates derived
            from the stated assumptions — not measured customer results.
          </p>
        </div>

        <ROICalculator />
      </section>

      {/* WHO WE'RE BUILDING FOR */}
      <section className="section bg-muted py-20 border-y">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-accent text-xs tracking-[3px] font-semibold mb-2">TARGET SEGMENTS</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">Who we&apos;re building for.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {segments.map((segment, index) => (
              <div key={index} className="card p-8 flex flex-col">
                <div className="text-accent text-sm font-semibold tracking-wider mb-4">{segment.title.toUpperCase()}</div>
                <p className="flex-1 text-lg text-muted-foreground">{segment.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Run one of these operations? The pilot program is how you get a seat at the table.
          </div>
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section className="section max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-12 gap-x-16 gap-y-10 items-center">
          <div className="lg:col-span-5">
            <div className="text-accent text-xs tracking-[3px] font-semibold mb-3">HARDWARE + SOFTWARE</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold leading-tight mb-6">Purpose-built for the floor.</h2>
            <p className="text-xl text-muted-foreground">
              Low-profile autonomous sanders, serious dust systems, and edge
              intelligence — orchestrated by one software layer. These are the design
              targets guiding development.
            </p>

            <div className="mt-8">
              <Button variant="accent" className="group" onClick={() => scrollTo("waitlist")}>
                Shape the pilot spec <ArrowRight className="ml-2 group-hover:translate-x-0.5 transition" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-4">
              {techHighlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 rounded-2xl border bg-white">
                  <CheckCircle className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div className="text-[15px] leading-snug">{item}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground px-2">
              Design targets, not shipped specifications. Pilot feedback drives what gets built first.
            </div>
          </div>
        </div>
      </section>

      {/* PLANNED PRICING */}
      <section id="pricing" className="section bg-white border-y py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-accent text-xs tracking-[3px] font-semibold mb-2">PLANNED PRICING</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">Simple pricing, designed to scale with you.</h2>
            <p className="mt-3 text-xl text-muted-foreground">
              Indicative pricing for the launch phase — subject to change as the pilot
              program defines the product.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Essentials */}
            <div className="card p-8 flex flex-col">
              <div>
                <div className="text-sm font-semibold tracking-widest text-muted-foreground">ESSENTIALS</div>
                <div className="mt-6 flex items-baseline">
                  <span className="text-6xl font-semibold tracking-[-2px]">$299</span>
                  <span className="text-muted-foreground ml-1.5">/mo base</span>
                </div>
                <div className="text-sm mt-1 text-muted-foreground">+ $149 /robot /month</div>
              </div>
              <ul className="mt-8 space-y-3.5 text-sm flex-1">
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Core autonomous sanding + reporting</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Base fleet dashboard</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Email + chat support</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Up to 3 robots</li>
              </ul>
              <Button variant="secondary" className="mt-8 w-full h-12" onClick={() => scrollTo("waitlist")}>Join waitlist</Button>
            </div>

            {/* Professional */}
            <div className="pricing-card featured card p-8 flex flex-col border-2 border-accent relative">
              <div>
                <div className="text-sm font-semibold tracking-widest text-accent">PROFESSIONAL</div>
                <div className="mt-6 flex items-baseline">
                  <span className="text-6xl font-semibold tracking-[-2px]">$799</span>
                  <span className="text-muted-foreground ml-1.5">/mo base</span>
                </div>
                <div className="text-sm mt-1 text-muted-foreground">+ $99 /robot /month</div>
              </div>
              <ul className="mt-8 space-y-3.5 text-sm flex-1">
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Full sanding + edging + finish assist</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Complete OS: planning, analytics, fleet</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Priority support + dedicated onboarding</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Unlimited robots • Advanced reporting</li>
              </ul>
              <Button variant="accent" className="mt-8 w-full h-12" onClick={() => scrollTo("waitlist")}>Join waitlist</Button>
            </div>

            {/* Enterprise */}
            <div className="card p-8 flex flex-col">
              <div>
                <div className="text-sm font-semibold tracking-widest text-muted-foreground">ENTERPRISE</div>
                <div className="mt-6">
                  <span className="text-5xl font-semibold tracking-[-1.5px]">Custom</span>
                </div>
                <div className="text-sm mt-1 text-muted-foreground">Volume pricing • Multi-site • API access</div>
              </div>
              <ul className="mt-8 space-y-3.5 text-sm flex-1">
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Everything in Professional</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Dedicated customer success manager</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Custom integrations &amp; SSO</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> On-site or remote training programs</li>
              </ul>
              <Button variant="secondary" className="mt-8 w-full h-12" onClick={() => scrollTo("waitlist")}>Contact us</Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Pilot participants receive preferential launch pricing.
          </p>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="section max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <div className="text-accent text-xs tracking-[3px] font-semibold mb-2">THE PILOT PROGRAM</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">Help us build it. Then run it first.</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            We&apos;re recruiting a small group of refinishing operations to define
            requirements, test early workflows, and get preferential launch terms.
          </p>
        </div>
        <WaitlistCTA />
      </section>

      {/* FINAL CTA */}
      <section className="bg-primary py-16 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">The floor is the next frontier.</h2>
          <p className="mt-4 text-xl sm:text-2xl text-white/80 tracking-tight">
            Autonomous refinishing is coming. Decide whether you shape it or react to it.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="lg" className="h-14 px-10 text-base" onClick={() => scrollTo("waitlist")}>
              Join the pilot waitlist
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-9 text-base border-white/40 text-white hover:bg-white/10"
              onClick={() => {
                const chatBtn = document.querySelector('[aria-label="Open FloorForge Assistant"]') as HTMLButtonElement;
                chatBtn?.click();
              }}
            >
              Ask the demo assistant
            </Button>
          </div>
        </div>
      </section>

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
}
