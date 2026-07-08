import type { NextConfig } from "next";

/**
 * The Pro Simulator teardown now renders natively in-browser via WebGL
 * (see components/simulator/ProTeardown.tsx) — there is no embedded Godot
 * player, so NO special cross-origin isolation headers are required. Keep
 * this config minimal; never apply COEP: require-corp globally or it will
 * break cross-origin subresources (Clerk, Supabase images, fonts, etc.).
 */
const nextConfig: NextConfig = {};

export default nextConfig;
