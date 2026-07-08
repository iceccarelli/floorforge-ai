import type { NextConfig } from "next";

/**
 * Pro Simulator (Godot) hosting:
 *
 * The recommended Godot web export is SINGLE-THREADED (Godot 4.3+). That mode
 * needs NO special HTTP headers, so leave PRO_SIM_THREADS = false and nothing
 * else is required — it just works on Vercel.
 *
 * ONLY flip this to true if you deliberately export a MULTI-THREADED Godot
 * build (SharedArrayBuffer). Then these two headers are required on the pages
 * that host the player. They are scoped to /pro-simulator and /pro-sim/* ONLY
 * — never apply COEP: require-corp globally, or it will break cross-origin
 * subresources across the whole site (Clerk, Supabase images, fonts, etc.).
 */
const PRO_SIM_THREADS = false;

const crossOriginIsolation = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
];

const nextConfig: NextConfig = {
  async headers() {
    if (!PRO_SIM_THREADS) return [];
    return [
      { source: "/pro-simulator", headers: crossOriginIsolation },
      { source: "/pro-sim/:path*", headers: crossOriginIsolation },
    ];
  },
};

export default nextConfig;
