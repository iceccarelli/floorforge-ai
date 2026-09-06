import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Clerk is optional: without keys the middleware is a pass-through so the
// site deploys on Vercel with zero env vars. With keys, the routes below are
// protected.
const authEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

// /operator/* reads and writes the pilot pipeline and was never in this list,
// so the operator console was open to anyone who knew the path.
//
// The API routes behind it are deliberately NOT matched here. A middleware
// match redirects an unauthenticated browser to a sign-in page, which is the
// right answer for a page and the wrong one for an API — a machine or a fetch
// needs a status code, not HTML. So /api/applications guards itself in the
// handler via lib/apiAuth.ts, which answers 401 when signed out and 503 when no
// identity provider is configured at all. Fail closed either way.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/operator(.*)",
]);

const handler = authEnabled
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : () => NextResponse.next();

export default handler;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
