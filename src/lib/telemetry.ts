import type Lenis from "lenis";

/**
 * A tiny mutable telemetry bus. Values change every frame, so they live outside
 * React state: the HUD and velocity-reactive sections read them inside their own
 * gsap.ticker callbacks and write straight to the DOM.
 */
export const telemetry = {
  /** Smoothed scroll velocity in px/frame. Positive = scrolling down. */
  velocity: 0,
  /** Last non-zero scroll direction: 1 down, -1 up. */
  direction: 1 as 1 | -1,
  /** Displayed road speed, km/h. */
  speed: 0,
  /** Displayed lean angle in degrees. Negative = left. */
  lean: 0,
  /** Displayed engine speed. */
  rpm: 0,
  /** When set, a section (the hero boot sweep) owns the tachometer. */
  rpmOverride: null as number | null,
  /** 0 = neutral, 1..6 = section gears. */
  gear: 0,
  /** Progress (0..1) through the active gear's section. */
  gearProgress: 0,
};

export const REDLINE_RPM = 12000;
export const MAX_RPM = 14000;
const IDLE_RPM = 1150;

export type GearId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const GEARS: { id: GearId; label: string; name: string; target: string }[] = [
  { id: 0, label: "N", name: "Neutral", target: "#ignition" },
  { id: 1, label: "1", name: "Ignition", target: "#ignition" },
  { id: 2, label: "2", name: "Anatomy of speed", target: "#anatomy" },
  { id: 3, label: "3", name: "Showroom lineup", target: "#lineup" },
  { id: 4, label: "4", name: "Services", target: "#services" },
  { id: 5, label: "5", name: "Rider's proof", target: "#proof" },
  { id: 6, label: "6", name: "Pit stop", target: "#pit-stop" },
];

type GearListener = (gear: GearId, previous: GearId) => void;
const gearListeners = new Set<GearListener>();

export function setGear(gear: GearId) {
  const previous = telemetry.gear as GearId;
  if (gear === previous) return;
  telemetry.gear = gear;
  gearListeners.forEach((listener) => listener(gear, previous));
}

export function onGearChange(listener: GearListener) {
  gearListeners.add(listener);
  return () => {
    gearListeners.delete(listener);
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v));

let lastScrollY = typeof window === "undefined" ? 0 : window.scrollY;

/**
 * Called once per gsap.ticker frame, right after Lenis advances.
 * Reads Lenis velocity (or native scroll delta when Lenis is disabled for
 * reduced motion) and derives speed, lean and rpm.
 */
export function sampleTelemetry(lenis: Lenis | null, time: number) {
  const y = window.scrollY;
  const raw = lenis ? (lenis.isScrolling ? lenis.velocity : 0) : y - lastScrollY;
  lastScrollY = y;

  telemetry.velocity = lerp(telemetry.velocity, raw, 0.25);
  if (Math.abs(raw) > 0.5) telemetry.direction = raw > 0 ? 1 : -1;

  const absV = Math.abs(telemetry.velocity);
  telemetry.speed = lerp(telemetry.speed, clamp(0, 299, absV * 4.6), 0.09);
  telemetry.lean = lerp(telemetry.lean, clamp(-58, 58, telemetry.velocity * 1.35), 0.07);

  let target: number;
  if (telemetry.rpmOverride !== null && telemetry.gear <= 1) {
    telemetry.rpm = telemetry.rpmOverride;
    return;
  }
  if (telemetry.gear === 0) {
    // A slightly lumpy idle, the way a big twin or V4 hunts at tickover.
    target = IDLE_RPM + Math.sin(time * 9) * 40 + Math.sin(time * 23) * 18;
  } else {
    // Revs build through each gear, then drop on the upshift.
    target = 3600 + telemetry.gearProgress * 8800 + absV * 26;
  }
  telemetry.rpm = lerp(telemetry.rpm, clamp(0, MAX_RPM, target), 0.12);
}
