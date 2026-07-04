"use client";

import React from "react";
import Link from "next/link";
import { 
  Zap, Shield, Target, Layers, Bot, BarChart3, Users, Award, 
  CheckCircle, ArrowRight, Play 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ROICalculator from "@/components/ROICalculator";
import Chatbot from "@/components/Chatbot";

const features = [
  {
    icon: Zap,
    title: "Autonomous Multi-Grit Sanding",
    description: "Real-time load sensing and species detection. 36→180 grit sequences executed with perfect pressure and overlap. 62% average time reduction vs manual crews.",
  },
  {
    icon: Target,
    title: "Precision Semi-Autonomous Edging",
    description: "LiDAR + vision edge detection handles baseboards, transitions, and complex perimeters with <2mm accuracy. Minimal hand work required.",
  },
  {
    icon: Layers,
    title: "Consistent Finish Application",
    description: "T-bar or robotic spray modes with live viscosity and ambient monitoring. Uniform sheen and film build every time — zero lap marks or holidays.",
  },
  {
    icon: Shield,
    title: "Superior Dust Containment",
    description: "Integrated HEPA-14 cyclonic system. <15 µg/m³ airborne during aggressive cuts. Full particulate reporting for every job included.",
  },
  {
    icon: Bot,
    title: "InteriorFinish OS Intelligence",
    description: "Shared planning, live fleet view, quality scoring, and analytics layer across DryForge, PaintForge, and FloorForge. One source of truth for the entire interior.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Operations",
    description: "Every pass, dust reading, and finish measurement logged. Instant post-job reports and trend analysis. Know exactly where margin is made or lost.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Site Capture & Digital Twin",
    desc: "Robot or technician performs rapid LiDAR + photogrammetry scan. FloorForge generates optimized multi-pass plan tailored to species, condition, and desired finish.",
  },
  {
    step: "02",
    title: "Autonomous Field Sanding",
    desc: "Multiple robots execute coordinated grit sequence with real-time adaptive pressure and speed. Edge robots handle perimeter simultaneously.",
  },
  {
    step: "03",
    title: "Precision Edging & Detail",
    desc: "Semi-autonomous edging pass with human oversight option. Handles complex transitions, vents, and built-ins with minimal rework.",
  },
  {
    step: "04",
    title: "Flawless Finish Application",
    desc: "T-bar or precision spray application. Environmental sensors ensure perfect cure conditions. Live monitoring of film build.",
  },
  {
    step: "05",
    title: "Quality Report & Analytics",
    desc: "Complete digital record: grit logs, dust metrics, finish uniformity, photos. Synced to InteriorFinish OS and shared with GC/property manager instantly.",
  },
];

const useCases = [
  {
    title: "High-End Residential",
    metric: "47% faster turnover",
    quote: "We went from 11-day refinish jobs to under 6 days with the same crew size. Callbacks dropped to near zero.",
    attribution: "Owner, Prestige Hardwood Refinishing — Austin, TX",
  },
  {
    title: "Commercial Office & Retail",
    metric: "3.1x more sq ft per week",
    quote: "FloorForge lets us bid and win large multi-floor projects we used to walk away from. The consistency is what wins repeat GC business.",
    attribution: "VP Operations, National Commercial Flooring — Chicago, IL",
  },
  {
    title: "Historic & Specialty",
    metric: "92% first-pass approval",
    quote: "On 1800s heart pine and walnut, the auto species detection and gentle start sequences have been game-changing. We protect the character while delivering modern performance.",
    attribution: "Lead Craftsman, Heritage Floor Studio — Philadelphia, PA",
  },
];

const techHighlights = [
  "Low-profile autonomous sanders (under 8\" height for door clearance)",
  "HEPA-14 + cyclonic pre-separation dust systems",
  "Edge-sensing LiDAR + high-res vision array",
  "Onboard species & moisture detection",
  "Shared InteriorFinish OS planning & fleet layer",
  "Offline capable with seamless cloud sync",
];

export default function FloorForgeLanding() {
  return (
    <div className="overflow-hidden">
      {/* HERO - AWS enterprise tone, confident & premium */}
      <section className="relative pt-16 pb-20 md:pt-20 md:pb-24 border-b">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1 text-xs font-medium tracking-[1.5px] mb-6">
            PART OF THE INTERIORFINISH OS PLATFORM
          </div>
          
          <h1 className="text-6xl md:text-7xl font-semibold tracking-[-2.8px] leading-[0.92] mb-6">
            Sand and Finish Hardwood Floors<br />with Unmatched Consistency and Speed.
          </h1>
          
          <p className="max-w-3xl mx-auto text-xl md:text-2xl text-muted-foreground tracking-[-0.3px] mb-10">
            The Operating System for Autonomous Floor Refinishing. Field sanding, edging assistance, 
            and perfect finish application — powered by the same software intelligence as DryForge and PaintForge.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#pricing">
              <Button variant="accent" size="lg" className="text-base px-9 h-14">
                Start 14-day free trial
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              size="lg" 
              className="text-base px-8 h-14 group"
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition" /> Watch 2-min overview
            </Button>
          </div>
          
          <div className="mt-8 text-xs text-muted-foreground flex items-center justify-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-success" /> No credit card required • Full platform access
          </div>
        </div>
      </section>

      {/* TRUSTED BY / KEY STATS BAR - Enterprise credibility */}
      <section className="stats-bar py-5 text-white/90 text-sm">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-center md:justify-between gap-x-8 gap-y-3 text-center md:text-left">
          <div>Trusted by crews who refuse to lose bids to inconsistency</div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 text-xs md:text-sm font-medium tracking-wider">
            <div>3.2× FASTER AVERAGE COMPLETION</div>
            <div>98.7% FIRST-PASS APPROVAL</div>
            <div>+41% REPORTED PROFIT MARGIN</div>
            <div>850+ ROBOTS DEPLOYED</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center mb-14">
          <div className="text-accent text-xs tracking-[3px] font-semibold mb-3">BUILT FOR THE CREWS THAT WIN</div>
          <h2 className="text-5xl tracking-[-1.8px] font-semibold">Everything you need to own hardwood refinishing.</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">Stop losing money to inconsistent sanding and callbacks. Turn every job into a predictable, high-margin operation.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="card p-8 group">
                <div className="feature-icon mb-6 group-hover:scale-105 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-2xl tracking-tight mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          The refinishing crews using FloorForge are booking months out.
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section bg-muted py-20 border-y">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <div className="text-accent text-xs tracking-[3px] font-semibold mb-2">THE WORKFLOW</div>
              <h2 className="text-5xl tracking-[-1.6px] font-semibold">From scan to sign-off in a fraction of the time.</h2>
            </div>
            <p className="mt-4 md:mt-0 max-w-md text-muted-foreground">The same proven intelligence that powers DryForge and PaintForge, now applied to the floor.</p>
          </div>

          <div className="space-y-4">
            {howItWorks.map((step, index) => (
              <div key={index} className="card p-8 md:p-9 flex flex-col md:flex-row gap-8 md:gap-12 items-start group">
                <div className="font-mono text-6xl font-semibold text-accent/70 tracking-[-3px] w-20 flex-shrink-0">{step.step}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-2xl tracking-tight mb-3 group-hover:text-accent transition-colors">{step.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI & BUSINESS IMPACT + INTERACTIVE CALCULATOR */}
      <section id="roi" className="section max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-accent text-xs tracking-[3px] font-semibold mb-3">THE NUMBERS THAT MATTER</div>
          <h2 className="text-5xl tracking-[-1.8px] font-semibold mb-4">Turn every hardwood refinish into a high-margin, data-driven operation.</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Real crews. Real economics. See what changes when you stop sanding by hand.</p>
        </div>

        <ROICalculator />

        <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3 p-5 rounded-xl border bg-white">
            <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
            <div>The last crews still hand-sanding are losing bids to FloorForge-powered teams on price and schedule.</div>
          </div>
          <div className="flex items-start gap-3 p-5 rounded-xl border bg-white">
            <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
            <div>Average reported margin improvement of 18–29% driven by speed, consistency, and near-zero callbacks.</div>
          </div>
          <div className="flex items-start gap-3 p-5 rounded-xl border bg-white">
            <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
            <div>Positioned as the logical next expansion after dominating walls (DryForge) and ceilings (PaintForge).</div>
          </div>
        </div>
      </section>

      {/* USE CASES & CUSTOMER STORIES */}
      <section className="section bg-muted py-20 border-y">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-accent text-xs tracking-[3px] font-semibold mb-2">REAL RESULTS FROM REAL CREWS</div>
            <h2 className="text-5xl tracking-[-1.6px] font-semibold">Use cases that win business.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="card p-8 flex flex-col">
                <div className="text-accent text-sm font-semibold tracking-wider mb-4">{useCase.title.toUpperCase()}</div>
                <div className="text-3xl font-semibold tracking-tight mb-6 text-accent">{useCase.metric}</div>
                <blockquote className="flex-1 text-lg italic text-muted-foreground">“{useCase.quote}”</blockquote>
                <div className="mt-6 pt-6 border-t text-sm text-muted-foreground font-medium">{useCase.attribution}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY & ROBOT INTEGRATION */}
      <section className="section max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-12 gap-x-16 gap-y-10 items-center">
          <div className="lg:col-span-5">
            <div className="text-accent text-xs tracking-[3px] font-semibold mb-3">HARDWARE + SOFTWARE</div>
            <h2 className="text-5xl tracking-[-1.8px] font-semibold leading-none mb-6">Purpose-built for the floor.<br />Unified with the suite.</h2>
            <p className="text-xl text-muted-foreground">Low-profile autonomous sanders, best-in-class dust systems, and edge intelligence — all running on the shared InteriorFinish OS that already powers your walls and ceilings.</p>
            
            <div className="mt-8">
              <Link href="#pricing">
                <Button variant="accent" className="group">
                  Explore deployment options <ArrowRight className="ml-2 group-hover:translate-x-0.5 transition" />
                </Button>
              </Link>
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
            <div className="mt-4 text-xs text-muted-foreground px-2">All hardware and software updates delivered over-the-air. No on-site technicians required for routine improvements.</div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section bg-white border-y py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-accent text-xs tracking-[3px] font-semibold mb-2">SIMPLE, TRANSPARENT, BUILT TO SCALE</div>
            <h2 className="text-5xl tracking-[-1.6px] font-semibold">Pricing designed as a powerful bolt-on expansion.</h2>
            <p className="mt-3 text-xl text-muted-foreground">Start with FloorForge alone or bundle with DryForge + PaintForge for maximum InteriorFinish OS value.</p>
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
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Basic InteriorFinish OS dashboard</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Email + chat support</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Up to 3 robots</li>
              </ul>
              <Button variant="secondary" className="mt-8 w-full h-12">Start free trial</Button>
            </div>

            {/* Professional - Featured */}
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
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Full autonomous sanding + edging + finish assist</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Complete InteriorFinish OS (planning, analytics, fleet)</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Priority support + dedicated onboarding</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Unlimited robots • Advanced reporting</li>
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> 25% bundle discount with DryForge + PaintForge</li>
              </ul>
              <Button variant="accent" className="mt-8 w-full h-12">Start free trial — most popular</Button>
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
                <li className="flex gap-3"><CheckCircle className="h-4 w-4 mt-1 text-success flex-shrink-0" /> Highest priority hardware &amp; software updates</li>
              </ul>
              <Button variant="secondary" className="mt-8 w-full h-12">Contact sales</Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">All plans include access to the full InteriorFinish OS core. 14-day full-feature trial. Cancel anytime.</p>
        </div>
      </section>

      {/* RESOURCES */}
      <section id="resources" className="section max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-accent text-xs tracking-[3px] font-semibold mb-2">DEEPEN YOUR KNOWLEDGE</div>
          <h2 className="text-5xl tracking-[-1.6px] font-semibold">Resources to help you win more work.</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Documentation", desc: "Complete guides for setup, workflows, and InteriorFinish OS integration." },
            { title: "Case Studies", desc: "Detailed before/after economics from crews who scaled with FloorForge." },
            { title: "API Reference", desc: "Build custom dashboards, reporting, or integrate with your existing CRM/ERP." },
            { title: "Webinars & Community", desc: "Monthly deep-dives and active practitioner community on Discord." },
          ].map((res, i) => (
            <div key={i} className="card p-7 group cursor-pointer hover:border-accent/40 transition-colors">
              <div className="font-semibold text-xl tracking-tight mb-3 group-hover:text-accent transition">{res.title}</div>
              <p className="text-muted-foreground text-[15px]">{res.desc}</p>
              <div className="mt-5 text-xs text-accent flex items-center gap-1 font-medium">Explore <ArrowRight className="h-3 w-3" /></div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="bg-primary py-16 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl tracking-[-1.8px] font-semibold">Ready to dominate hardwood refinishing?</h2>
          <p className="mt-4 text-2xl text-white/80 tracking-tight">Join the crews who are already booked months out. Start your 14-day free trial today.</p>
          
          <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#pricing">
              <Button variant="accent" size="lg" className="h-14 px-10 text-base">Start free trial</Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-9 text-base border-white/40 text-white hover:bg-white/10"
              onClick={() => {
                const chatBtn = document.querySelector('[aria-label="Open FloorForge Assistant"]') as HTMLButtonElement;
                chatBtn?.click();
              }}
            >
              Talk to our floor specialists
            </Button>
          </div>
          <div className="mt-5 text-xs text-white/50">No credit card required. Full access to Professional tier during trial.</div>
        </div>
      </section>

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
}
