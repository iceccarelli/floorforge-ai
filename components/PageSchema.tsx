import { buildPageGraph, type PageMeta } from "@/lib/discovery";

/**
 * Page-level JSON-LD.
 *
 * Before this, all twelve routes served the identical Organization + WebSite
 * graph. Every page described the COMPANY and no page described ITSELF, so an
 * assistant asked "is there a free tool that checks subfloor moisture against
 * NWFA limits?" had nothing structured to match against — only prose it had to
 * be lucky enough to have crawled.
 *
 * A server component on purpose: this must be in the HTML a crawler receives,
 * not assembled after hydration.
 */
export default function PageSchema({ page }: { page: PageMeta }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPageGraph(page)) }}
    />
  );
}
