"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ArrowUpRight, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, scrollToElement } from "@/lib/scroll";
import {
  CATEGORIES,
  FEATURED,
  FRAMES,
  type CatKey,
  categoryOf,
  frameById,
  frameSrc,
  framesInCat,
} from "@/lib/showcase";

/* Every frame is a fixed 784×1168 WebP; cards and the lightbox use
   fixed-aspect-ratio boxes with next/image `fill`, so layout is reserved
   before the image loads and the section never shifts (zero CLS). */

/* ------------------------------------------------------------------ */
/*  Lightbox                                                           */
/* ------------------------------------------------------------------ */

function Lightbox({
  list,
  index,
  onIndexChange,
  onClose,
}: {
  list: string[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const id = list[index];
  const frame = frameById(id);
  const cat = categoryOf(frame ? frame.cat : "sand");
  const similar = framesInCat(cat.key)
    .filter((f) => f.id !== id)
    .slice(0, 6);

  const go = useCallback(
    (dir: 1 | -1) => onIndexChange((index + dir + list.length) % list.length),
    [index, list.length, onIndexChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const motionProps = reduce
    ? {}
    : {
        initial: { opacity: 0, scale: 0.98, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 8 },
        transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const },
      };

  return (
    <Dialog.Portal forceMount>
      <Dialog.Overlay asChild forceMount>
        <motion.div
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm"
          initial={reduce ? undefined : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      </Dialog.Overlay>

      <Dialog.Content
        asChild
        forceMount
        aria-describedby={`sc-desc-${cat.key}`}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <motion.div
          {...motionProps}
          className="fixed inset-0 z-[61] flex items-stretch justify-center p-0 sm:p-6 md:p-10"
        >
          <div className="relative flex w-full max-w-6xl flex-col overflow-hidden bg-card shadow-2xl sm:rounded-2xl md:flex-row">
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/90 text-foreground backdrop-blur transition hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>

            {/* Image panel */}
            <div className="relative w-full shrink-0 bg-slate-950 md:w-[52%]">
              <div className="relative mx-auto aspect-[4/5] w-full sm:aspect-[3/4] md:h-full md:aspect-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={id}
                    className="absolute inset-0"
                    initial={reduce ? undefined : { opacity: 0 }}
                    animate={reduce ? undefined : { opacity: 1 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Image
                      src={frameSrc(id)}
                      alt={`${cat.platform} — ${cat.label} (concept render ${id})`}
                      fill
                      sizes="(max-width: 768px) 100vw, 52vw"
                      className="object-contain"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
                <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90">
                  Concept render · {id}
                </span>
              </div>

              <button
                aria-label="Previous view"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 text-foreground shadow-sm backdrop-blur transition hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Next view"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 text-foreground shadow-sm backdrop-blur transition hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Detail panel */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 sm:p-8">
              <div className="text-xs font-semibold uppercase tracking-[2px] text-accent">
                {cat.eyebrow}
              </div>
              <Dialog.Title className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {cat.label}
              </Dialog.Title>
              <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Cpu className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">{cat.platform}</span>
                <span className="text-border">·</span>
                <span>concept platform</span>
              </div>

              <Dialog.Description
                id={`sc-desc-${cat.key}`}
                className="mt-5 text-[15px] leading-relaxed text-muted-foreground"
              >
                {cat.blurb}
              </Dialog.Description>

              <div className="mt-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Measurements
                </div>
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
                  {cat.specs.map((s) => (
                    <div key={s.label} className="bg-card p-4">
                      <dt className="text-xs text-muted-foreground">{s.label}</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold tracking-tight text-foreground">
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {cat.sequence && (
                <div className="mt-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pass sequence
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {cat.sequence.map((seq, i) => (
                      <React.Fragment key={seq}>
                        <span className="rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-xs text-foreground">
                          {seq}
                        </span>
                        {i < cat.sequence!.length - 1 && (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {similar.length > 0 && (
                <div className="mt-7 border-t border-border pt-5">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Similar views · {cat.label}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {similar.map((s) => {
                      const target = list.indexOf(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() =>
                            target >= 0 ? onIndexChange(target) : undefined
                          }
                          className="group text-left"
                          disabled={target < 0}
                        >
                          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-border bg-muted">
                            <Image
                              src={frameSrc(s.id)}
                              alt={`${cat.platform} — ${s.id}`}
                              fill
                              sizes="140px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-7">
                <Button
                  variant="accent"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    onClose();
                    requestAnimationFrame(() => scrollToElement("waitlist"));
                  }}
                >
                  Put this platform in your pilot
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

/* ------------------------------------------------------------------ */
/*  Featured swipe rail                                                */
/* ------------------------------------------------------------------ */

function FeaturedRail({ onOpen }: { onOpen: (id: string) => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const nudge = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({
      left: dir * amount,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <div className="relative mt-10">
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent transition-opacity",
          atStart ? "opacity-0" : "opacity-100"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent transition-opacity",
          atEnd ? "opacity-0" : "opacity-100"
        )}
      />

      <button
        aria-label="Scroll left"
        onClick={() => nudge(-1)}
        disabled={atStart}
        className={cn(
          "absolute -left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition md:flex",
          atStart ? "cursor-not-allowed opacity-0" : "hover:border-accent hover:text-accent"
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Scroll right"
        onClick={() => nudge(1)}
        disabled={atEnd}
        className={cn(
          "absolute -right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition md:flex",
          atEnd ? "cursor-not-allowed opacity-0" : "hover:border-accent hover:text-accent"
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={scrollerRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {FEATURED.map((id) => {
          const frame = frameById(id);
          const cat = categoryOf(frame ? frame.cat : "sand");
          return (
            <button
              data-card
              key={id}
              onClick={() => onOpen(id)}
              className="group snap-start shrink-0 basis-[82%] text-left sm:basis-[360px] lg:basis-[384px]"
              aria-label={`${cat.label} — open details`}
            >
              <div className="card overflow-hidden p-0">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-950">
                  <Image
                    src={frameSrc(id)}
                    alt={`${cat.platform} — ${cat.label} (concept render ${id})`}
                    fill
                    sizes="(max-width: 640px) 82vw, 384px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
                    {cat.label}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-white/70">
                      {cat.platform}
                    </div>
                    <div className="mt-0.5 text-lg font-semibold leading-tight tracking-tight text-white">
                      {cat.eyebrow}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 gap-4">
                    {cat.specs.slice(0, 2).map((s) => (
                      <div key={s.label} className="min-w-0">
                        <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                          {s.label}
                        </div>
                        <div className="font-mono text-sm font-semibold tracking-tight text-foreground">
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition group-hover:border-accent group-hover:bg-accent-light group-hover:text-accent">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category gallery                                                   */
/* ------------------------------------------------------------------ */

function Gallery({
  activeCat,
  onCat,
  onOpen,
}: {
  activeCat: CatKey;
  onCat: (k: CatKey) => void;
  onOpen: (list: string[], idx: number) => void;
}) {
  const frames = framesInCat(activeCat);
  const cat = categoryOf(activeCat);
  const list = frames.map((f) => f.id);

  return (
    <div className="mt-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-accent">
            The full system library
          </div>
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Every view, sorted by what the machine is doing.
          </h3>
        </div>
        <div className="text-sm text-muted-foreground">
          {FRAMES.length} concept renders · {CATEGORIES.length} platforms
        </div>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => {
          const count = framesInCat(c.key).length;
          const on = c.key === activeCat;
          return (
            <button
              key={c.key}
              onClick={() => onCat(c.key)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
                on
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-white text-muted-foreground hover:border-accent hover:text-accent"
              )}
            >
              {c.label}
              <span
                className={cn(
                  "ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  on ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active category description */}
      <div className="mt-6 flex items-start gap-3">
        <Cpu className="mt-1 h-5 w-5 shrink-0 text-accent" />
        <p className="max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{cat.platform}</span> —{" "}
          {cat.blurb}
        </p>
      </div>

      {/* Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {frames.map((f, i) => (
          <button
            key={f.id}
            onClick={() => onOpen(list, i)}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-slate-950 text-left"
            aria-label={`${cat.label} — ${f.id}, open details`}
          >
            <Image
              src={frameSrc(f.id)}
              alt={`${cat.platform} — ${cat.label} (concept render ${f.id})`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 transition group-hover:opacity-100">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

export default function ShowcaseCarousel() {
  const [activeCat, setActiveCat] = useState<CatKey>("sand");
  const [box, setBox] = useState<{ list: string[]; idx: number } | null>(null);

  const openById = (id: string) => {
    const f = frameById(id);
    const list = framesInCat(f ? f.cat : "sand").map((x) => x.id);
    setBox({ list, idx: Math.max(0, list.indexOf(id)) });
  };

  return (
    <section
      id="showcase"
      className="section border-b bg-white py-20 md:py-24"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-accent">
            Autonomous floor refinishing systems
          </div>
          <h2
            id="showcase-heading"
            className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl"
          >
            The machines, working the floor on their own.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Concept renders of the Forge platforms operating independently on
            hardwood — sanding, edging, dust capture, finishing, and QA. Swipe
            the featured rail, or open the full library below by platform.
          </p>
        </div>

        <FeaturedRail onOpen={openById} />

        <Gallery
          activeCat={activeCat}
          onCat={setActiveCat}
          onOpen={(list, idx) => setBox({ list, idx })}
        />

        <p className="mt-8 text-xs text-muted-foreground">
          Renders depict concept platforms; all figures are design targets, not
          measured specifications of shipping hardware.
        </p>
      </div>

      <Dialog.Root open={box !== null} onOpenChange={(o) => !o && setBox(null)}>
        <AnimatePresence>
          {box !== null && (
            <Lightbox
              list={box.list}
              index={box.idx}
              onIndexChange={(idx) => setBox((b) => (b ? { ...b, idx } : b))}
              onClose={() => setBox(null)}
            />
          )}
        </AnimatePresence>
      </Dialog.Root>
    </section>
  );
}
