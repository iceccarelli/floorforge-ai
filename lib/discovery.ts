/**
 * How machines read this site.
 *
 * Three things were wrong, and all three were invisible from a browser.
 *
 * 1. THE llms.txt POINTER SURVIVED ON EXACTLY ONE PAGE. app/layout.tsx sets
 *    `alternates.types` so every crawler is pointed at /llms.txt. Next.js
 *    REPLACES `alternates` wholesale when a child route declares its own —
 *    and every tool page declares `alternates: { canonical: "/x" }`. So the
 *    pointer survived on `/` and was dropped from the other eleven routes.
 *    An agent landing on /moisture from a search had no route to the
 *    machine-readable summary written specifically for it. `pageAlternates()`
 *    below exists so that cannot happen again: pages call it instead of
 *    hand-writing the object.
 *
 * 2. EVERY ROUTE EMITTED IDENTICAL JSON-LD. All twelve served the same
 *    Organization + WebSite graph. Correct, conservative — and it meant no
 *    page described ITSELF. An agent asked "is there a free tool that checks
 *    subfloor moisture against NWFA limits?" had nothing to match on but prose.
 *
 * 3. robots.txt NEVER MENTIONED llms.txt. It is the first file an agent
 *    fetches and it declared the sitemap but not the summary.
 *
 * WHAT IS AND IS NOT CLAIMABLE HERE. The standing rule is that no Offer or
 * Product markup may describe hardware that does not exist. That rule is
 * unchanged and still enforced. The seven browser tools are a different thing
 * entirely: they exist, they run today, they cost nothing, they need no
 * account, and anyone can verify all four by loading the page. Describing
 * those as `SoftwareApplication` with `isAccessibleForFree: true` and a
 * zero-price offer is not a claim about the robots — it is the plainest true
 * statement the site can make in machine-readable form, and it is the exact
 * thing an assistant needs in order to recommend a tool to a contractor.
 *
 * No offer here may ever carry a non-zero price, and no machine is described
 * as purchasable. verifyapplied.sh asserts both.
 */

import { GRIT_SEQUENCE } from "./product";
import { getRobot } from "./robots";
import {
  SLAB_MVER_MAX_LB,
  SLAB_RH_MAX_PCT,
  WOOD_DIFFERENTIAL_MAX_PCT,
  AMBIENT_TEMP_F,
  AMBIENT_RH_PCT,
} from "./moisture";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://floorforge-ai.vercel.app";

/**
 * Canonical + the llms.txt pointer, together, so the pointer cannot be
 * dropped by declaring one without the other. Every page's `alternates`
 * should be this call and nothing else.
 */
export function pageAlternates(path: string) {
  return {
    canonical: path,
    types: { "text/plain": "/llms.txt" },
  };
}

/* -------------------------------------------------------------- the tools */

export interface ToolEntry {
  path: string;
  name: string;
  /** One sentence a machine can quote back. */
  description: string;
  /** What a person can do with it, for `featureList`. */
  features: string[];
}

/**
 * The tools that exist and run today. Nothing aspirational belongs in this
 * list: if it is here, a contractor can use it in a browser right now, free,
 * with no account. That is the whole basis on which the schema below is
 * honest.
 */
export const TOOLS: ToolEntry[] = [
  {
    path: "/jobs",
    name: "FloorForge Jobs",
    description:
      "A free job workspace for hardwood refinishing contractors: one record per floor from first measurement to client sign-off, saved in the browser with no account and no server.",
    features: [
      "One record per floor, estimate through sign-off",
      "Stage tracking",
      "Saved in the visitor's own browser",
    ],
  },
  {
    path: "/estimator",
    name: "FloorForge Job Estimator",
    description: `A free estimating tool for hardwood refinishing contractors: grit sequence, crew hours, abrasive and finish quantities, and a defensible quote. Includes a client proposal view that omits the cost basis. Every assumption is editable.`,
    features: [
      `Grit sequence (${GRIT_SEQUENCE.join(" → ")})`,
      "Crew hours, abrasive and finish quantities",
      "Perimeter derived from floor area",
      "Client proposal without the cost basis",
    ],
  },
  {
    path: "/moisture",
    name: "FloorForge Moisture & Readiness Log",
    description: `A free jobsite readiness log: subfloor and flooring moisture against the NWFA differential (${WOOD_DIFFERENTIAL_MAX_PCT.strip}% for solid strip under 3 in., ${WOOD_DIFFERENTIAL_MAX_PCT.plank}% for plank 3 in. and wider), concrete slabs against ASTM F2170 (${SLAB_RH_MAX_PCT}% in-situ RH) and ASTM F1869 (${SLAB_MVER_MAX_LB} lb per 1,000 sq ft per 24 h), and jobsite conditions against ${AMBIENT_TEMP_F.min}–${AMBIENT_TEMP_F.max} °F and ${AMBIENT_RH_PCT.min}–${AMBIENT_RH_PCT.max}% RH. Every limit is displayed with the document it comes from. The limits are published industry guidance, not FloorForge claims, and the tool certifies nothing.`,
    features: [
      "NWFA subfloor-to-flooring differential by face width",
      "ASTM F2170 and ASTM F1869 concrete slab limits",
      "Required slab test-location count",
      "Every limit shown with its source document",
      "Dated, printable record",
    ],
  },
  {
    path: "/report",
    name: "FloorForge Completion Report",
    description:
      "A free completion-report generator for hardwood refinishing contractors: what was done, the conditions it was done in, care and maintenance instructions, and a workmanship warranty, on one signed page.",
    features: [
      "Work performed and site conditions",
      "Care and maintenance instructions",
      "Workmanship warranty and sign-off",
      "Prints to PDF",
    ],
  },
  {
    path: "/live",
    name: "FloorForge Live Job Console",
    description: `A free tool that runs a SIMULATED refinishing job end to end. A ${getRobot("sand").name} works the open field and a ${getRobot("edge").name} works the perimeter band the drum cannot reach, alternating once per grit, both emitting telemetry in the firmware contract's own shape. No hardware is connected and neither machine exists; what is real is the data path.`,
    features: [
      "Simulated two-machine job, field and perimeter",
      "Telemetry in the firmware contract's own shape",
      "Fills the completion report's coverage fields",
    ],
  },
  {
    path: "/simulator",
    name: "FloorForge 3D Simulator",
    description:
      "A free interactive concept simulation: pick one of the five concept platforms, size a room, and watch a coverage pass run with live area and job-time estimates. Every figure is a design target for hardware in development, not a record of a completed job.",
    features: [
      "Five concept platforms",
      "Boustrophedon coverage pass",
      "Live area and job-time estimates",
    ],
  },
];

export const toolFor = (path: string) => TOOLS.find((t) => t.path === path);

/* ------------------------------------------------------------ the payload */

export interface PageMeta {
  path: string;
  name: string;
  description: string;
  /** Crumb label. Omitted on the homepage. */
  crumb?: string;
}

type Json = Record<string, unknown>;

/**
 * The page-level graph.
 *
 * Organization and WebSite are emitted once, site-wide, by
 * components/StructuredData.tsx in the root layout. This block references them
 * by `@id` rather than repeating them — one entity, described once, linked to
 * from every page that belongs to it.
 */
export function buildPageGraph(page: PageMeta): Json {
  const graph: Json[] = [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}${page.path}#webpage`,
      url: `${SITE_URL}${page.path}`,
      name: page.name,
      description: page.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      inLanguage: "en",
    },
  ];

  if (page.crumb) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${SITE_URL}${page.path}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: page.crumb },
      ],
    });
  }

  const tool = toolFor(page.path);
  if (tool) {
    graph.push({
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}${tool.path}#app`,
      name: tool.name,
      url: `${SITE_URL}${tool.path}`,
      description: tool.description,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Construction estimating and documentation",
      operatingSystem: "Any — runs in a web browser",
      browserRequirements:
        "Requires JavaScript. No installation and no account.",
      featureList: tool.features,
      // TRUE, and verifiable by loading the page: these run today and cost
      // nothing. This is not an offer for hardware — no machine exists and
      // none is described as purchasable anywhere in this graph.
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
