import { ImageResponse } from "next/og";

/**
 * Open Graph / Twitter card image.
 *
 * WHY THIS EXISTS (audit/FINDINGS.md §7)
 * --------------------------------------
 * The site declared og:title and og:description but no image, and
 * twitter:card defaulted to `summary` rather than `summary_large_image`. Every
 * link pasted into a contractor's inbox, a trade Slack, or LinkedIn rendered as
 * a bare text row. For a company whose entire acquisition channel is one link
 * being shared, that is a measurable loss with no upside.
 *
 * WHAT IT DELIBERATELY DOES NOT SAY
 * ---------------------------------
 * No performance figure. No customer count. No testimonial, certification or
 * partner logo. Nothing that implies a shipped product or an existing customer
 * (mission Part II.1). It carries the same honesty labelling the page does —
 * "In active development · Pilot program forming" — because a preview card is
 * the first thing a prospect reads, and it should not be the one place the site
 * overstates itself.
 *
 * Rendered at build time by next/og, so there is no runtime cost and no binary
 * in the repo.
 */

export const runtime = "edge";
export const alt =
  "FloorForge — an operating system for autonomous hardwood floor refinishing. In active development; pilot program forming.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f172a",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 68,
              height: 68,
              borderRadius: 18,
              background: "#b45309",
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: -1.5,
            }}
          >
            FF
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 40,
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: -1.4,
              }}
            >
              FloorForge
            </div>
            <div
              style={{
                fontSize: 17,
                color: "#868a94",
                letterSpacing: 3,
                marginTop: 2,
              }}
            >
              EARLY ACCESS
            </div>
          </div>
        </div>

        {/* Positioning — the same words the page uses, no stronger */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 66,
              lineHeight: 1.08,
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: -2.6,
              maxWidth: 940,
            }}
          >
            Autonomous sanding and finishing for hardwood floors.
          </div>
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.4,
              color: "#868a94",
              marginTop: 26,
              maxWidth: 900,
            }}
          >
            An operating system for autonomous floor refinishing — job planning,
            multi-grit orchestration, dust and quality reporting.
          </div>
        </div>

        {/* Honesty label. Present on the card for the same reason it is present
            on the page: a preview is a claim, and this one should not overstate. */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 3, background: "#b45309" }} />
          <div style={{ fontSize: 23, color: "#868a94" }}>
            In active development · Pilot program forming
          </div>
        </div>
      </div>
    ),
    size
  );
}
