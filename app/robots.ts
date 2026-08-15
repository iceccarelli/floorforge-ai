import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://floorforge-ai.vercel.app";

/**
 * The crawlers that read this site are increasingly not search engines.
 *
 * A single `userAgent: "*"` rule already permitted every AI crawler, because
 * allow-by-default is what a wildcard means. Naming them changes nothing
 * mechanically and a great deal in practice: it is the difference between "we
 * never thought about it" and "we decided". Anyone auditing whether this site
 * wants to be summarised by assistants can see the answer in one file, and
 * crawlers that look for a specific token find one.
 *
 * Every one of these is ALLOWED deliberately. FloorForge is pre-launch and its
 * whole distribution problem is being found; being cited accurately by an
 * assistant is worth more than a click. /llms.txt exists to make that citation
 * accurate, and it is linked from the document head so a crawler is not made to
 * guess the URL.
 */
const AI_CRAWLERS = [
  "GPTBot",           // OpenAI
  "OAI-SearchBot",    // OpenAI, search surface
  "ChatGPT-User",     // OpenAI, user-initiated fetch
  "ClaudeBot",        // Anthropic
  "Claude-Web",       // Anthropic, user-initiated fetch
  "anthropic-ai",     // Anthropic, legacy token
  "PerplexityBot",    // Perplexity
  "Google-Extended",  // Gemini grounding
  "Applebot-Extended",// Apple Intelligence
  "CCBot",            // Common Crawl — feeds many models
  "Bytespider",       // ByteDance
  "Amazonbot",        // Amazon
  "meta-externalagent", // Meta
  "cohere-ai",        // Cohere
];

// The dashboard is a non-functional mock preview and /operator/* is an internal
// console; neither belongs in any index, human or machine.
const DISALLOW = ["/dashboard", "/operator/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
