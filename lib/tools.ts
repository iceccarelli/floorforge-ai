/**
 * The free tools, in one list.
 *
 * Four working products — jobs, estimator, live console, completion report —
 * plus the 3D simulator, were each written into the header's mobile menu, the
 * footer and the homepage card grid separately. Three hand-maintained copies of
 * the same list, which is how /live ended up in two of them and missing from
 * the desktop navigation entirely: a visitor on a laptop could only reach the
 * live console by landing on the homepage and scrolling to the Tools section.
 *
 * Everything that lists the tools now reads this. Adding the next one is a line
 * here, not a hunt through three components.
 */

export interface ToolLink {
  href: string;
  label: string;
  /** One line, in the menu, under the label. Says what it does, not what it is. */
  blurb: string;
  /** Small badge, e.g. "3D". Omitted for most. */
  badge?: string;
}

export const FREE_TOOLS: ToolLink[] = [
  {
    href: "/jobs",
    label: "Jobs",
    blurb: "One record per job, estimate through sign-off.",
  },
  {
    href: "/estimator",
    label: "Estimate & proposal",
    blurb: "Price a floor and print a proposal the client can sign.",
  },
  {
    href: "/live",
    label: "Live job console",
    blurb: "Watch a simulated D1 work the floor and fill in the report.",
  },
  {
    href: "/report",
    label: "Completion report",
    blurb: "Hand over the floor with proof of what was done.",
  },
  {
    href: "/simulator",
    label: "3D simulator",
    blurb: "Drive the platforms across a virtual floor.",
    badge: "3D",
  },
];
