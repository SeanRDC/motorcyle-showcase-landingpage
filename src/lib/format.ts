import { gsap } from "./gsap";

const thousands = new Intl.NumberFormat("en-US");

export const formatNumber = (value: number, decimals = 0) =>
  decimals > 0 ? value.toFixed(decimals) : thousands.format(Math.round(value));

/**
 * Adds a counter that ticks the element's text from 0 to `to` onto a timeline
 * (or returns a standalone tween). Used for every telemetry readout on the page.
 */
export function countTo(
  el: Element | null,
  to: number,
  vars: gsap.TweenVars & { decimals?: number; pad?: number } = {},
) {
  const { decimals = 0, pad = 0, ...tweenVars } = vars;
  const proxy = { v: 0 };
  return gsap.to(proxy, {
    v: to,
    duration: 1.2,
    ease: "power2.out",
    ...tweenVars,
    onUpdate: () => {
      if (!el) return;
      const text = formatNumber(proxy.v, decimals);
      el.textContent = pad ? text.padStart(pad, "0") : text;
    },
  });
}
