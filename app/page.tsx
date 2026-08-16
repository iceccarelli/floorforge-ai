"use client";

import React from "react";
import {
  Zap, Shield, Target, Layers, Bot, BarChart3,
  CheckCircle, MinusCircle, ArrowRight, ArrowDown,
  ClipboardList, Calculator, FileSignature, ClipboardCheck, Cpu, Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ROICalculator from "@/components/ROICalculator";
import Chatbot from "@/components/Chatbot";
import WaitlistCTA from "@/components/WaitlistCTA";
import Reveal from "@/components/Reveal";
import ShowcaseCarousel from "@/components/ShowcaseCarousel";
import Link from "next/link";
import { ROBOTS, getRobot } from "@/lib/robots";
import {
  GRIT_RANGE_LABEL,
  HARDWARE_UNIT_COST_LABEL,
  RAAS_MONTHLY_LABEL,
  RAAS_MONTHLY_LOW_USD,
  RAAS_MONTHLY_HIGH_USD,
  RAAS_TERM_MONTHS,
  RAAS_SERVICE_RESERVE_PCT,
  MACHINES_PER_COMPLETE_FLOOR,
  SOFTWARE_TIERS,
} from "@/lib/product";
import { scrollToElement } from "@/lib/scroll";
import { openChatbot } from "@/lib/chatbot";

const scrollTo = (id: string) => scrollToElement(id);

/**
 * The software that exists today. Ordered the way a job actually moves:
 * open the job, price it, send the proposal, hand over the report.
 */
const tools = [
  {
    href: "/jobs",
    icon: ClipboardList,
    title: "Jobs",
    description:
      "One record per floor, from first measurement to client sign-off. Measure once; every document reads the same job.",
    bullets: ["Stage tracking", "Nothing typed twice", "Saved in your browser"],
    cta: "Open jobs",
  },
  {
    href: "/estimator",
    icon: Calculator,
    title: "Job estimator",
    description:
      "Enter the floor and get the grit sequence, crew hours with the arithmetic shown, abrasive and finish quantities, and a price you can defend line by line.",
    bullets: [
      "Species-aware grit planning",
      "Every assumption editable",
      "Materials and margin",
    ],
    cta: "Estimate a job",
  },
  {
    href: "/estimator",
    icon: FileSignature,
    title: "Client proposal",
    description:
      "The same estimate as a document you can hand a homeowner — scope, sequence, duration, inclusions, price and signature lines.",
    bullets: [
      "Never shows your margin",
      "Your letterhead, saved once",
      "Prints to PDF",
    ],
    cta: "Build a proposal",
  },
  {
    href: "/live",
    icon: Cpu,
    title: "Live job console",
    description:
      `Watch a simulated ${getRobot("sand").name} cut the field and a simulated ` +
      `${getRobot("edge").name} cut the band at the wall, alternating once per grit — ` +
      "pressure, dust and coverage the whole way, then handed to the completion report.",
    bullets: [
      "Real firmware-contract telemetry",
      "Field and perimeter reported separately",
      "Simulated machines, real data path",
    ],
    cta: "Run a job",
  },
  {
    href: "/moisture",
    icon: Droplets,
    title: "Moisture & readiness",
    description:
      "The check that decides whether the job happens at all. Subfloor and flooring moisture, slab readings and room conditions against the published NWFA and ASTM limits — each printed beside the reading it judged.",
    bullets: [
      "Every limit shown with its source",
      "Wood differential and concrete slabs",
      "Dated record if it is ever disputed",
    ],
    cta: "Log the readings",
  },
  {
    href: "/report",
    icon: ClipboardCheck,
    title: "Completion report",
    description:
      "Hand over the floor with proof: what was run, the conditions it was run in, care instructions that stop callbacks, and a workmanship warranty.",
    bullets: [
      "Care and maintenance guidance",
      "Warranty and sign-off",
      "Telemetry fills it in later",
    ],
    cta: "Create a report",
  },
];

/**
 * What the free tier actually contains. Mirrors `tools` above deliberately —
 * if a product is added there and not here, the pricing section is lying by
 * omission about what "free" includes.
 */
const freeTierIncludes = [
  "Job records, estimate to sign-off",
  "Job estimator with editable assumptions",
  "Client proposals on your letterhead",
  "Completion reports with care guidance",
  "Live job console with simulated telemetry",
  "Unlimited jobs",
  "Print or save any document as PDF",
];

const features = [
  {
    icon: Zap,
    title: "Autonomous Multi-Grit Sanding",
    description:
      "Designed around real-time load sensing and species detection, executing the 36→80→120 grit sequence with consistent pressure and pass overlap — the same cut, every pass, every job.",
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

          <p className="max-w-2xl mx-auto -mt-4 mb-10 text-base sm:text-lg text-foreground">
            The robots are in development.{" "}
            <strong className="font-semibold">
              The planning and documentation software is finished, free, and yours to use
              on the next job.
            </strong>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="accent" size="lg" className="text-base px-9 h-14">
              <Link href="/jobs">Use the free tools</Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="text-base px-8 h-14"
              onClick={() => scrollTo("waitlist")}
            >
              Join the pilot waitlist
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-base px-6 h-14 group"
              onClick={() => scrollTo("how-it-works")}
            >
              <ArrowDown className="mr-2 h-4 w-4 group-hover:translate-y-0.5 transition" />
              How it works
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

      {/* ---------------------------------------------------------------
          SOFTWARE AVAILABLE TODAY

          This sits above the concept renders on purpose. Everything below it
          describes hardware in development; everything in it is software a
          refinishing crew can open on tomorrow's job. Burying the only part of
          the product that exists underneath the part that does not was the
          single largest positioning error on the page.
          --------------------------------------------------------------- */}
      <section id="tools" className="section max-w-7xl mx-auto px-6 pt-20 pb-16">
        <Reveal>
          <div className="max-w-3xl">
            <div className="text-accent text-xs tracking-[3px] font-semibold">
              AVAILABLE TODAY · FREE · NO ACCOUNT
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">
              The hardware is in development. The software is not.
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Five tools a refinishing crew can use on the next job, with no FloorForge
              machine anywhere near the site. Nothing to install, no account to create,
              and none of your work leaves your browser.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {tools.map((tool, i) => (
            <Reveal key={tool.href} delay={i * 0.05}>
              <Link
                href={tool.href}
                className="tool-card group flex h-full flex-col rounded-2xl border-2 border-border-strong bg-card p-6 transition-colors hover:border-accent"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-accent">
                    <tool.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="text-lg font-semibold tracking-tight">{tool.title}</div>
                </div>
                <p className="mt-3 flex-1 text-muted-foreground">{tool.description}</p>
                <ul className="mt-4 space-y-1 text-sm text-foreground">
                  {tool.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <CheckCircle
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      {b}
                    </li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  {tool.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 max-w-3xl text-sm text-muted-foreground">
            These were built for the pilot program and released early, because a tool that
            helps a crew this week is worth more than a brochure about next year. They
            carry no claims about FloorForge hardware: the one figure that describes a
            machine is labelled a design target, and it reads from the same constant as
            the ROI model below.
          </p>
        </Reveal>
      </section>

      {/* AUTONOMOUS FLOOR REFINISHING SYSTEMS — product showcase */}
      <ShowcaseCarousel />

      {/* SIMULATOR TEASER */}
      <section className="section border-b bg-muted py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="flex flex-col items-start gap-6 rounded-2xl border border-border bg-card p-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <span className="mb-3 inline-block rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  Interactive concept demo
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Drive the robots yourself — before they exist in your shop
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Pick a platform, size the room, and watch a live coverage pass
                  fill the floor with real-time area and job-time estimates. A 3D
                  way to explore how autonomous refinishing would run — figures
                  are design targets, not completed-job records.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ROBOTS.map((r) => (
                    <span
                      key={r.id}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: r.color }}
                      />
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
              <Button asChild variant="accent" size="lg" className="shrink-0">
                <Link href="/simulator">
                  Open the 3D simulator <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center mb-14">
          <div className="text-accent text-xs tracking-[3px] font-semibold mb-3">WHAT WE&apos;RE BUILDING</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">Three grits, two machines, one record.</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            A {GRIT_RANGE_LABEL} sequence across the field, a {(getRobot("sand").edgeGapM ?? 0) * 100} cm
            perimeter the drum cannot reach and an edger that can, and a completion
            report written from the machines&apos; own telemetry rather than from memory.
            Inconsistent sanding and callbacks burn margin; the answer is a job that
            documents itself.
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
                <div className="font-mono text-6xl font-semibold text-accent tracking-[-3px] w-20 flex-shrink-0">{step.step}</div>
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold mb-4">Run the model on your own numbers.</h2>
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold leading-tight mb-6">Five platforms, because one machine cannot finish a floor.</h2>
            <p className="text-xl text-muted-foreground">
              A {getRobot("sand").workingWidthM.toFixed(2)} m drum leaves a band at every
              wall it physically cannot cut, so the edger is not an accessory — it is
              half the job. Scanning, coating and plank placement follow the same
              logic: each platform exists because a specific step needs a different
              machine. All figures are design targets guiding development.
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
                <div key={idx} className="flex items-start gap-4 p-6 rounded-2xl border bg-card">
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
      <section id="pricing" className="section bg-background border-y py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-accent text-xs tracking-[3px] font-semibold mb-2">PRICING</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">Free today. Priced when the robots ship.</h2>
            <p className="mt-3 mx-auto max-w-2xl text-xl text-muted-foreground">
              One tier exists and costs nothing. The other three describe a launch phase
              that has not happened, and every figure in them is indicative and subject to
              change as the pilot program defines the product.
            </p>
          </div>

          {/* The free tier is first and visually distinct because it is the only
              one a visitor can act on. Listing it beside three planned tiers
              without a marker would let a design target read as an offer. */}
          <div className="mb-8 rounded-2xl border-2 border-accent bg-accent-light p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="status status-good">Available now</span>
                  <div className="text-sm font-semibold tracking-widest text-accent">
                    FREE FOREVER
                  </div>
                </div>
                <div className="mt-4 flex items-baseline">
                  <span className="text-6xl font-semibold tracking-[-2px]">$0</span>
                  {/* --foreground: --muted-foreground on --accent-light is 4.27:1 (illegal). */}
                  <span className="ml-2 text-foreground">no card, no account</span>
                </div>
                <p className="mt-3 text-foreground">
                  The full planning and documentation toolkit, usable today on a job with
                  no FloorForge hardware anywhere near it. Your work stays in your browser.
                </p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2 text-sm">
                  {freeTierIncludes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[220px]">
                <Button asChild variant="accent" className="h-12 w-full justify-center">
                  <Link href="/jobs">Start a job — free</Link>
                </Button>
                <Button asChild variant="secondary" className="h-12 w-full justify-center">
                  <Link href="/estimator">Try the estimator</Link>
                </Button>
                <p className="text-xs text-foreground">
                  Nothing to install. Nothing is uploaded.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3 border-t border-border-strong pt-8">
            <span className="status status-neutral">Planned</span>
            <p className="text-sm text-muted-foreground">
              The tiers below require FloorForge hardware, which does not exist yet. They
              describe the intended launch model, not something you can buy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Essentials */}
            <div className="card p-8 flex flex-col">
              <div>
                <div className="text-sm font-semibold tracking-widest text-muted-foreground">ESSENTIALS</div>
                <div className="mt-6 flex items-baseline">
                  <span className="text-6xl font-semibold tracking-[-2px]">
                    ${SOFTWARE_TIERS.essentials.baseUsd}
                  </span>
                  <span className="text-muted-foreground ml-1.5">/mo base</span>
                </div>
                <div className="text-sm mt-1 text-muted-foreground">
                  + ${SOFTWARE_TIERS.essentials.perRobotUsd} /robot /month
                </div>
              </div>
              <ul className="mt-8 space-y-3.5 text-sm flex-1">
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Core autonomous sanding + reporting</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Base fleet dashboard</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Email + chat support</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Up to 3 robots</li>
                {/* The perimeter line, on every tier.
                    Essentials is a D1 only, and a drum cannot cut the band at
                    the wall — so this tier leaves ~4.5% of every floor for
                    somebody to edge by hand. At the estimator's own 40 ft/h
                    that is hours per job, and a contractor comparing the two tiers
                    had no way to see it before the sales call. Same
                    principle as the hardware-priced-separately banner below. */}
                <li className="flex gap-3 text-muted-foreground">
                  <MinusCircle className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="font-medium text-foreground">Perimeter:</strong> field
                    only. The band at the wall is edged manually or with an E1 on
                    Professional.
                  </span>
                </li>
              </ul>
              <Button variant="secondary" className="mt-8 w-full h-12" onClick={() => scrollTo("waitlist")}>Join waitlist</Button>
            </div>

            {/* Professional */}
            <div className="pricing-card featured card p-8 flex flex-col border-2 border-accent relative">
              <div>
                <div className="text-sm font-semibold tracking-widest text-accent">PROFESSIONAL</div>
                <div className="mt-6 flex items-baseline">
                  <span className="text-6xl font-semibold tracking-[-2px]">
                    ${SOFTWARE_TIERS.professional.baseUsd}
                  </span>
                  <span className="text-muted-foreground ml-1.5">/mo base</span>
                </div>
                <div className="text-sm mt-1 text-muted-foreground">
                  + ${SOFTWARE_TIERS.professional.perRobotUsd} /robot /month
                </div>
              </div>
              <ul className="mt-8 space-y-3.5 text-sm flex-1">
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Full sanding + edging + finish assist</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Complete OS: planning, analytics, fleet</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Priority support + dedicated onboarding</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Unlimited robots • Advanced reporting</li>
                <li className="flex gap-3">
                  <CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" />
                  <span>
                    <strong className="font-medium">Perimeter:</strong> cut by an E1, once
                    per grit — a whole floor, not just the field.
                  </span>
                </li>
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
                <li className="flex gap-3">
                  <CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" />
                  <span>
                    <strong className="font-medium">Perimeter:</strong> included, plus
                    multi-crew scheduling across sites.
                  </span>
                </li>
              </ul>
              <Button variant="secondary" className="mt-8 w-full h-12" onClick={() => scrollTo("waitlist")}>Contact us</Button>
            </div>
          </div>

          {/* The table used to show only the monthly subscription, while the
              product definition describes the post-pilot model as hardware sale
              PLUS subscription (PRODUCT_SERVICE_DEFINITION.md:298-299). A
              contractor reading "$799/mo" would not have budgeted for the
              machine, and would find out during the sales call — the most
              expensive possible moment (audit/PRODUCT_TRUTH.md T1-3). */}
          {/* TWO WAYS TO GET THE MACHINES.
              The site described one: buy the robot. A finished floor takes a D1
              for the field and an E1 for the band the drum cannot reach, so
              that is two units of capital before the first floor — asked of
              small flooring contractors, which is exactly who the pilot is
              recruiting. Every figure below is derived in lib/product.ts from
              numbers already published on this page, so the monthly rate can be
              checked rather than believed. */}
          <div className="mt-10 grid gap-5 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="rounded-xl border-2 border-accent bg-card p-6">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-semibold tracking-wider text-accent">
                  ROBOTS AS A SERVICE
                </span>
                <span className="rounded bg-accent-light px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
                  planned
                </span>
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-4xl font-semibold tracking-[-1.5px]">
                  {RAAS_MONTHLY_LABEL}
                </span>
                <span className="ml-1.5 text-muted-foreground">/robot /month</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                No capital. Hardware, software, service, consumables and replacement in
                one line over a {RAAS_TERM_MONTHS}-month term.
              </p>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Capital recovery</dt>
                  <dd className="tabular-nums">
                    {HARDWARE_UNIT_COST_LABEL} ÷ {RAAS_TERM_MONTHS} mo
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Service reserve</dt>
                  <dd className="tabular-nums">{RAAS_SERVICE_RESERVE_PCT}% of that</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Platform software</dt>
                  <dd className="tabular-nums">the per-robot tier fee</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-1.5 font-medium">
                  <dt>A complete floor needs {MACHINES_PER_COMPLETE_FLOOR}</dt>
                  <dd className="tabular-nums">
                    ${(RAAS_MONTHLY_LOW_USD * MACHINES_PER_COMPLETE_FLOOR).toLocaleString()}–
                    {(RAAS_MONTHLY_HIGH_USD * MACHINES_PER_COMPLETE_FLOOR).toLocaleString()} /mo
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-border-strong bg-muted p-6">
              <span className="text-xs font-semibold tracking-wider text-foreground">
                BUY THE HARDWARE
              </span>
              <div className="mt-3 flex items-baseline">
                <span className="text-4xl font-semibold tracking-[-1.5px]">
                  {HARDWARE_UNIT_COST_LABEL}
                </span>
                <span className="ml-1.5 text-muted-foreground">/unit, indicative</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Subscription tiers above cover the software, fleet dashboard and support;
                the machines are bought outright and serviced separately.
              </p>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4 border-t border-border pt-1.5 font-medium">
                  <dt>A complete floor needs {MACHINES_PER_COMPLETE_FLOOR}</dt>
                  <dd className="tabular-nums">$30–50K up front</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Unit economics are not locked — they depend on manufacturing quotes the
                pilot program is designed to produce.
              </p>
            </div>
          </div>

          <div className="mt-6 mx-auto max-w-3xl rounded-xl border border-border-strong bg-muted px-5 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">
                Neither of these is an offer.
              </strong>{" "}
              No FloorForge machine has been built and no manufacturer has quoted a unit
              cost, so both columns are design targets like every other figure on this
              site — the service rate is arithmetic on the indicative hardware price, not
              a price list. Pilot participants receive a loaner unit at no hardware cost,
              and the pilot is what replaces these with real numbers.
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] font-semibold">The pilot decides what this becomes.</h2>
          <p className="mt-4 text-xl sm:text-2xl text-white/80 tracking-tight">
            Unit economics, the grit sequence, what the report has to prove — none of it
            is settled, and pilot partners are the people who settle it. Loaner unit at
            no hardware cost, preferential launch pricing, and a say in the machine.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="lg" className="h-14 px-10 text-base" onClick={() => scrollTo("waitlist")}>
              Join the pilot waitlist
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-9 text-base border-white/40 text-white hover:bg-white/10"
              onClick={openChatbot}
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
