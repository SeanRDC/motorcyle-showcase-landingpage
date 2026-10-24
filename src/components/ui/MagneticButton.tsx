import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { gsap, useGSAP } from "../../lib/gsap";

type MagneticButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** How far the button follows the pointer (0..1 of the pointer offset). */
  strength?: number;
  /** Extra classes for the static hit-area wrapper. */
  wrapperClassName?: string;
};

/**
 * The button drifts toward the pointer while its label drifts further, giving a
 * two-layer parallax pull. The wrapper never moves, so the hit area stays stable
 * and the pointer maths doesn't feed back on itself.
 */
export function MagneticButton({
  children,
  strength = 0.32,
  className = "",
  wrapperClassName = "",
  ...rest
}: MagneticButtonProps) {
  const wrap = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!finePointer || reduce || !wrap.current || !button.current || !label.current) return;

      const area = wrap.current;
      const bx = gsap.quickTo(button.current, "x", { duration: 0.5, ease: "power3" });
      const by = gsap.quickTo(button.current, "y", { duration: 0.5, ease: "power3" });
      const lx = gsap.quickTo(label.current, "x", { duration: 0.6, ease: "power3" });
      const ly = gsap.quickTo(label.current, "y", { duration: 0.6, ease: "power3" });

      const onMove = contextSafe!((e: PointerEvent) => {
        const r = area.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        bx(dx * strength);
        by(dy * strength);
        lx(dx * strength * 0.45);
        ly(dy * strength * 0.45);
      });
      const onLeave = contextSafe!(() => {
        gsap.to([button.current, label.current], {
          x: 0,
          y: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.38)",
          overwrite: true,
        });
      });

      area.addEventListener("pointermove", onMove);
      area.addEventListener("pointerleave", onLeave);
      return () => {
        area.removeEventListener("pointermove", onMove);
        area.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: wrap },
  );

  return (
    <span ref={wrap} className={`relative inline-block p-4 -m-4 ${wrapperClassName}`}>
      <button ref={button} className={`relative will-change-transform ${className}`} {...rest}>
        <span ref={label} className="relative inline-flex items-center gap-3 will-change-transform">
          {children}
        </span>
      </button>
    </span>
  );
}
