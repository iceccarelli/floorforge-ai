/**
 * The operator boundary.
 *
 * WHAT THIS CLOSES. `GET /api/applications` returned the entire pilot pipeline
 * — name, email, phone, company, monthly sqft target, internal notes — to
 * anyone who requested it. Its own comment read "TODO: Add auth check… For now,
 * this is open for demo purposes." `proxy.ts` protected `/dashboard(.*)` only,
 * so neither the operator pages nor the API behind them were covered. That is
 * the company's sales pipeline, and it was curl-able.
 *
 * FAIL CLOSED. When Clerk is not configured these routes return **503**, not
 * data. The repository's guiding principle is that the site builds and deploys
 * with zero environment variables (`.env.example:1`), and that principle is
 * right for the marketing site — but "no auth configured" must mean "the
 * operator API is unavailable", never "the operator API is open". A deployment
 * that has not been given an identity provider does not get to serve leads.
 *
 * WHAT THIS IS NOT. This proves the caller is *signed in*. It does not prove
 * *which tenant* they belong to, because `users` has no column linking a row to
 * a Clerk subject — there is no way, today, to turn a session into a
 * `tenant_id`. So tenant-scoped routes still take `tenant_id` as a parameter
 * and this guard cannot check it.
 *
 * That gap is named, not papered over. Closing it is the next mission in
 * FLOORFORGE_SYSTEM_BASELINE.md: add the identity mapping, resolve tenancy from
 * the session, and delete every `tenant_id` query parameter in the API. Until
 * then this file removes an open door and does not claim to be a lock.
 */

import { auth } from "@clerk/nextjs/server";

export const operatorAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export type OperatorAuthCode = "OPERATOR_AUTH_NOT_CONFIGURED" | "UNAUTHENTICATED";

export class OperatorAuthError extends Error {
  readonly code: OperatorAuthCode;
  readonly status: number;

  constructor(code: OperatorAuthCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "OperatorAuthError";
  }
}

export interface OperatorIdentity {
  /** Clerk subject. Not yet resolvable to a `users` row — see the note above. */
  subject: string;
}

export async function requireOperator(): Promise<OperatorIdentity> {
  if (!operatorAuthConfigured) {
    throw new OperatorAuthError(
      "OPERATOR_AUTH_NOT_CONFIGURED",
      "The operator API is unavailable because no identity provider is " +
        "configured. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY. " +
        "This endpoint returns 503 rather than serving pilot applications " +
        "without an authenticated caller.",
      503
    );
  }

  const { userId } = await auth();
  if (!userId) {
    throw new OperatorAuthError(
      "UNAUTHENTICATED",
      "Sign-in required.",
      401
    );
  }

  return { subject: userId };
}
