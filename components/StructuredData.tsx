const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://floorforge-ai.vercel.app";

/**
 * JSON-LD for search engines. Deliberately conservative: describes an
 * early-stage organization and its site. No aggregateRating, no reviews,
 * no Product/Offer markup — none of those exist yet, and asserting them
 * would be structured-data fabrication that risks a manual action.
 */
export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "FloorForge",
        url: SITE_URL,
        description:
          "Early-stage operating system for autonomous hardwood floor refinishing. In active development; pilot program forming.",
        parentOrganization: {
          "@type": "Organization",
          name: "Grimaldi Engineering",
        },
        email: "vince.ceccarelli@gmail.com",
        sameAs: ["https://github.com/iceccarelli"],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "FloorForge",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
