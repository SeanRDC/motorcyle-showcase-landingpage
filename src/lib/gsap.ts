import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Mobile URL-bar show/hide fires resize; don't recalculate every pin for it.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, useGSAP };

/** Media-query conditions shared by every section's gsap.matchMedia() setup. */
export const MOTION_CONDITIONS = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 768px)",
} as const;

export type MotionConditions = { motion: boolean; reduce: boolean; desktop: boolean };
