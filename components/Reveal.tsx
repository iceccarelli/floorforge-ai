"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Accessible scroll-reveal wrapper. Fades + lifts content in once as it
 * enters the viewport. Respects prefers-reduced-motion: users who opt out
 * get the content immediately with no transform. framer-motion is already
 * a dependency, so this adds no bundle cost beyond the component itself.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
