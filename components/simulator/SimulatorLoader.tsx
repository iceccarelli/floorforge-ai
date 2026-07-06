"use client";

import dynamic from "next/dynamic";

const Simulator = dynamic(() => import("@/components/simulator/Simulator"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="h-[440px] animate-pulse rounded-2xl border border-border bg-muted/50" />
      <div className="flex min-h-[440px] animate-pulse items-center justify-center rounded-2xl border border-border bg-muted/50">
        <span className="text-sm text-muted-foreground">
          Loading 3D simulator…
        </span>
      </div>
    </div>
  ),
});

export default function SimulatorLoader() {
  return <Simulator />;
}
