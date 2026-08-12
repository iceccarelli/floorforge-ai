import { ROBOTS } from "@/lib/robots";

/**
 * Submitting the pilot waitlist to FloorForge's own lead pipeline.
 *
 * The finding this exists for (audit/PRODUCT_TRUTH.md T0-4): FloorForge built a
 * complete lead-capture system — a validated `POST /api/applications`, a
 * `pilot_applications` table, a ten-state lifecycle from `new` through
 * `qualified` to `piloting`, and an operator console at
 * `/operator/applications` to triage it — and then wired the website's only
 * conversion form to formspree.io instead. The `source` enum's first value is
 * literally `"floorforge-site"` (`lib/types.ts:86`). The form was designed for
 * this endpoint and was never connected to it.
 *
 * The consequence is not theoretical. The operator console has never had a row
 * to triage, the ten-state lifecycle has never advanced once, and the site's
 * only conversion path depends on a third-party service nobody configured —
 * while the equivalent system the company owns sits idle.
 *
 * Three tiers now, in order, so the CTA is never dead (mission Part II.2):
 *   1. POST /api/applications — the real pipeline. Leads land in the operator
 *      console. Needs Supabase credentials, which the product needs anyway.
 *   2. Formspree — only if NEXT_PUBLIC_FORMSPREE_FORM_ID is set.
 *   3. A prefilled mailto the prospect sends themselves.
 */

export interface WaitlistInput {
  name: string;
  email: string;
  company: string;
  volume: string;
  interest: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export type SubmitResult =
  | { kind: "created" }
  /** The API rejected the input. Its own field errors drive the form's inline errors. */
  | { kind: "invalid"; errors: FieldError[] }
  /** The endpoint is unreachable or unconfigured — fall through to the next tier. */
  | { kind: "unavailable"; reason: string };

/**
 * "25,000 sqft" / "25000" / "~25k" -> 25000.
 *
 * The form asks for a free-text volume because a slider would be a worse
 * question. The API requires a positive number
 * (`lib/validators.ts:47-56`), so parse rather than reject: a contractor who
 * types "25,000 sqft/mo" has answered correctly and should not be told they
 * haven't.
 */
export function parseMonthlySqft(raw: string): number {
  const cleaned = raw.trim().toLowerCase().replace(/[,\s]/g, "");
  const m = cleaned.match(/([\d.]+)\s*(k)?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return 0;
  return Math.round(m[2] === "k" ? n * 1000 : n);
}

/**
 * "ForgeSand D1" -> "sand".
 *
 * The simulator deep-links `?interest=<robot.name>`
 * (`components/simulator/Simulator.tsx:98`) while `robot_interest` is the
 * platform code (`lib/types.ts:84`). Accepts either, so a link that already
 * exists in the wild keeps working.
 */
export function platformCodeFor(interest: string): string | undefined {
  if (!interest) return undefined;
  const v = interest.trim().toLowerCase();
  const byName = ROBOTS.find((r) => r.name.toLowerCase() === v);
  if (byName) return byName.id;
  const byCode = ROBOTS.find((r) => r.id === v);
  return byCode?.id;
}

/** API field name -> the input id whose error message it should render under. */
export const FIELD_TO_INPUT: Record<string, string> = {
  name: "waitlist-name",
  email: "waitlist-email",
  company: "waitlist-company",
  monthly_sqft_target: "waitlist-volume",
};

export async function submitToPilotApi(input: WaitlistInput): Promise<SubmitResult> {
  const payload = {
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company.trim(),
    monthly_sqft_target: parseMonthlySqft(input.volume),
    robot_interest: platformCodeFor(input.interest) ?? null,
    source: "floorforge-site" as const,
    source_details: input.interest ? `simulator:${input.interest}` : undefined,
  };

  let res: Response;
  try {
    res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return { kind: "unavailable", reason: e instanceof Error ? e.message : "network error" };
  }

  if (res.status === 201) return { kind: "created" };

  if (res.status === 400) {
    // The API already knows what is wrong and which field it is wrong on
    // (`app/api/applications/route.ts:19-31`). Surfacing its errors verbatim
    // means the form has no second copy of the validation rules to drift from.
    try {
      const body = await res.json();
      const errors = body?.error?.details?.errors;
      if (Array.isArray(errors) && errors.length) return { kind: "invalid", errors };
    } catch {
      /* fall through */
    }
    return { kind: "invalid", errors: [{ field: "email", message: "Please check your details and try again." }] };
  }

  // 5xx — most likely Supabase credentials absent, which is exactly the state
  // production is in today. Not the prospect's problem: fall to the next tier.
  return { kind: "unavailable", reason: `API responded ${res.status}` };
}
