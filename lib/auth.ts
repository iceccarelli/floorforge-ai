/**
 * Auth is optional. The site must build and deploy on Vercel with zero env
 * vars. When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set (build-time inlined),
 * Clerk UI and route protection turn on automatically.
 */
export const authEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);
