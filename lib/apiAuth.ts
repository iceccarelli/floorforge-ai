/**
 * The operator boundary: who is calling, and whose data may they touch.
 *
 * WHAT THIS CLOSES. Every tenant-scoped route took `tenant_id` as a **query
 * parameter** — the caller chose whose jobs to read. `GET /api/applications`
 * took nothing at all and returned the entire pilot pipeline, with its own
 * comment reading "For now, this is open for demo purposes." And the database's
 * answer to all of this, RLS, could never fire: every policy in
 * migrations/001 is keyed on `auth.uid()`, the subject of a **Supabase Auth**
 * session, while this product authenticates with **Clerk** and never creates
 * one. (FLOORFORGE_SYSTEM_BASELINE.md §3.4; migrations/003 header.)
 *
 * So authorization happens here, on the server, and `lib/db/server.ts` requires
 * a tenant id in the signature of every tenant-scoped query. Forgetting to
 * scope a request is a type error rather than a data breach.
 *
 * THREE ANSWERS, AND THE DIFFERENCE MATTERS:
 *
 *   503  no identity provider is configured. Not "open", not "empty" — the
 *        operator API is unavailable. The repository's principle that the site
 *        deploys with zero environment variables is right for the marketing
 *        site; it must never mean the pipeline is served to the internet.
 *   401  no session, or a session whose subject has no `users` row. A Clerk
 *        account that nobody has linked to a tenant is not an operator.
 *   403  a real operator reaching for something outside their tenant, or above
 *        their role.
 *
 * WHAT IS STILL NOT HERE. Nothing links a Clerk subject to a `users` row until
 * migrations/003 is applied and somebody populates `auth_subject`. Until then
 * every authenticated request resolves to 401 IDENTITY_NOT_PROVISIONED, which
 * is the correct failure: an unprovisioned deployment serves nobody rather than
 * serving everybody.
 */

import type { UserRole } from "@/lib/types";

export const operatorAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export type OperatorAuthCode =
  | "OPERATOR_AUTH_NOT_CONFIGURED"
  | "UNAUTHENTICATED"
  | "IDENTITY_NOT_PROVISIONED"
  | "TENANT_FORBIDDEN"
  | "ROLE_FORBIDDEN"
  | "NO_TENANT";

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

/**
 * Roles that act across tenants. These are FloorForge's own staff, not a
 * contractor's: the RaaS provider has to be able to look at a pilot's fleet to
 * support it. Everyone else is pinned to exactly one tenant.
 *
 * `pilot_admin` is deliberately NOT here. It is a *customer's* administrator —
 * the person who runs a flooring company's account — and giving it cross-tenant
 * reach would mean any pilot customer could read every other pilot's jobs.
 */
export const PLATFORM_ROLES: readonly UserRole[] = Object.freeze([
  "system_admin",
  "support",
]);

export function isPlatformRole(role: UserRole): boolean {
  return PLATFORM_ROLES.includes(role);
}

export interface OperatorIdentity {
  /** Identity-provider subject (Clerk `sub`). */
  subject: string;
  /** `users.id`. */
  userId: string;
  /** `users.tenant_id`. Null for platform staff, who belong to no customer. */
  tenantId: string | null;
  role: UserRole;
}

/**
 * Reads the identity-provider subject for the current request, or null when
 * nobody is signed in.
 *
 * Injected rather than imported at module scope for two reasons. Clerk's server
 * package is built for a bundler — its internal imports have no file extensions
 * — so importing it at the top of this file drags the whole of it into any
 * runtime that is not Next.js, including `node --test`. And an authorization
 * boundary that can only be exercised inside a running Next.js server with a
 * live Clerk session is an authorization boundary nobody tests.
 *
 * The default below dynamic-imports Clerk, so routes get it for free and
 * nothing loads it until a real request needs it.
 */
export type SessionReader = () => Promise<string | null>;

async function clerkSubject(): Promise<string | null> {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId ?? null;
}

/** The one thing this module needs from the database. Injected so it is testable. */
export interface IdentityStore {
  findUserByAuthSubject(subject: string): Promise<{
    id: string;
    tenant_id: string | null;
    role: UserRole;
  } | null>;
}

/**
 * Resolves the caller. Throws rather than returning null: there is no code path
 * in this product where "could not identify the caller" should be handled by
 * carrying on.
 */
export async function requireOperator(
  store: IdentityStore,
  readSession: SessionReader = clerkSubject
): Promise<OperatorIdentity> {
  if (!operatorAuthConfigured) {
    throw new OperatorAuthError(
      "OPERATOR_AUTH_NOT_CONFIGURED",
      "The operator API is unavailable because no identity provider is " +
        "configured. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY. " +
        "This endpoint returns 503 rather than serving tenant data without an " +
        "authenticated caller.",
      503
    );
  }

  // Note what is NOT a parameter here: anything from the request. A subject
  // taken from a header would be an authentication bypass with extra steps.
  // `readSession` is supplied by the route (always the Clerk default) or by a
  // test — never by a caller over the wire.
  const subject = await readSession();
  if (!subject) {
    throw new OperatorAuthError("UNAUTHENTICATED", "Sign-in required.", 401);
  }

  const user = await store.findUserByAuthSubject(subject);
  if (!user) {
    throw new OperatorAuthError(
      "IDENTITY_NOT_PROVISIONED",
      "This account is not linked to a FloorForge user. An administrator must " +
        "set users.auth_subject for it before it can reach tenant data.",
      401
    );
  }

  return {
    subject,
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
  };
}

export function requireRole(
  identity: OperatorIdentity,
  allowed: readonly UserRole[]
): void {
  if (!allowed.includes(identity.role)) {
    throw new OperatorAuthError(
      "ROLE_FORBIDDEN",
      `This action requires one of: ${allowed.join(", ")}.`,
      403
    );
  }
}

/**
 * Decides which tenant a request operates on.
 *
 * This is the function that replaces `req.nextUrl.searchParams.get("tenant_id")`.
 * The rule, in full:
 *
 *   - A customer user is pinned to their own tenant. A `tenant_id` in the
 *     request is accepted only if it matches, and refused with 403 otherwise —
 *     refused rather than ignored, because a client sending the wrong tenant is
 *     either broken or probing, and silently returning the right data teaches
 *     nobody anything.
 *   - Platform staff (system_admin, support) may name any tenant, because
 *     supporting a pilot means looking at it. They must name one: there is no
 *     implicit "all tenants" for a tenant-scoped query, since that is how a
 *     support tool becomes an export of the whole platform by accident.
 *
 * `requested` is untrusted input. It is never the answer on its own.
 */
export function resolveTenantScope(
  identity: OperatorIdentity,
  requested: string | null | undefined
): string {
  if (isPlatformRole(identity.role)) {
    if (!requested) {
      throw new OperatorAuthError(
        "NO_TENANT",
        "Platform staff must name a tenant_id for tenant-scoped requests.",
        400
      );
    }
    return requested;
  }

  if (!identity.tenantId) {
    throw new OperatorAuthError(
      "NO_TENANT",
      "This account belongs to no tenant.",
      403
    );
  }

  if (requested && requested !== identity.tenantId) {
    throw new OperatorAuthError(
      "TENANT_FORBIDDEN",
      "You may only access data in your own tenant.",
      403
    );
  }

  return identity.tenantId;
}
