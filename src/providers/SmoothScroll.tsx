import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";

const LenisContext = createContext<Lenis | null>(null);

/**
 * Owns the single animation loop: gsap.ticker drives Lenis (seconds -> ms) and
 * Lenis notifies ScrollTrigger on every scroll. Lenis is not created at all
 * under prefers-reduced-motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = reduced ? null : new Lenis({ autoRaf: false, lerp: 0.09, smoothWheel: true });
    instance?.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      instance?.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance?.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

/** Scrolls to a selector or element through Lenis, falling back to native scrolling. */
export function useScrollTo() {
  const lenis = useContext(LenisContext);
  return useCallback(
    (target: string | HTMLElement, offset = 0) => {
      if (lenis) {
        lenis.scrollTo(target, { offset, duration: 1.8 });
        return;
      }
      const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
      if (!el) return;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "auto" });
    },
    [lenis],
  );
}
