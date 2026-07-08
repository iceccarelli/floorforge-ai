"use client";

import dynamic from "next/dynamic";

const ProTeardown = dynamic(
  () => import("@/components/simulator/ProTeardown"),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video w-full animate-pulse items-center justify-center rounded-2xl border border-border bg-[#0b0e14]">
        <span className="text-sm text-white/50">Loading teardown…</span>
      </div>
    ),
  }
);

export default function ProTeardownLoader(props: {
  robotId: string;
  roomW: string;
  roomL: string;
}) {
  return <ProTeardown {...props} />;
}
