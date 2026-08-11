"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence } from "framer-motion";
import { Gallery, Lightbox } from "@/components/ShowcaseCarousel";
import { type CatKey } from "@/lib/showcase";

/**
 * The full concept-render library, on its own route.
 *
 * This is the same Gallery the homepage used to embed. Moving it here is not a
 * demotion: it makes the library an indexable page with its own URL, its own
 * <h1> and its own place in the sitemap, and it stops every homepage visitor
 * paying for 33 images they may never scroll to (audit/FINDINGS.md §6).
 *
 * The lightbox state lives here rather than in Gallery so a deep-linked visitor
 * lands on the grid, not inside a modal.
 */
export default function SystemsLibrary() {
  const [activeCat, setActiveCat] = useState<CatKey>("sand");
  const [box, setBox] = useState<{ list: string[]; idx: number } | null>(null);

  return (
    <>
      <Gallery
        activeCat={activeCat}
        onCat={setActiveCat}
        onOpen={(list, idx) => setBox({ list, idx })}
      />

      <Dialog.Root open={box !== null} onOpenChange={(o) => !o && setBox(null)}>
        <AnimatePresence>
          {box !== null && (
            <Lightbox
              list={box.list}
              index={box.idx}
              onIndexChange={(idx) => setBox((b) => (b ? { ...b, idx } : b))}
              onClose={() => setBox(null)}
            />
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
