import { useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { GEARS, MAX_RPM, REDLINE_RPM, onGearChange, telemetry, type GearId } from "../lib/telemetry";
import { useScrollTo } from "../providers/SmoothScroll";

const REDLINE_PCT = (REDLINE_RPM / MAX_RPM) * 100;
const SEGMENT_MASK =
  "repeating-linear-gradient(90deg, #000 0 calc(100% / 28 - 2px), transparent calc(100% / 28 - 2px) calc(100% / 28))";
const WEDGE = "polygon(0 72%, 100% 0, 100% 100%, 0 100%)";
const SCALE = [0, 2, 4, 6, 8, 10, 12, 14];

/**
 * Fixed TFT instrument frame. Per-frame readouts are written straight to the DOM
 * from a gsap.ticker callback; React only re-renders when the gear changes.
 */
export function HudOverlay() {
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<GearId>(0);
  const scrollTo = useScrollTo();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const fill = q("[data-hud=fill]")[0] as HTMLElement;
      const rpmText = q("[data-hud=rpm]")[0] as HTMLElement;
      const speedText = q("[data-hud=speed]")[0] as HTMLElement;
      const leanText = q("[data-hud=lean]")[0] as HTMLElement;
      const horizon = root.current!.querySelector<SVGGElement>("[data-hud=horizon]")!;
      const shift = q("[data-hud=shift]")[0] as HTMLElement;
      const digit = q("[data-hud=digit]")[0] as HTMLElement;
      const ghost = q("[data-hud=ghost]")[0] as HTMLElement;
      const box = q("[data-hud=gearbox]")[0] as HTMLElement;

      let lastRpm = -1;
      let lastSpeed = -1;
      let lastLean = 999;
      let shiftOn = false;

      const tick = (time: number) => {
        const rpm = Math.round(telemetry.rpm / 10) * 10;
        if (rpm !== lastRpm) {
          lastRpm = rpm;
          fill.style.clipPath = `inset(0 ${100 - (rpm / MAX_RPM) * 100}% 0 0)`;
          rpmText.textContent = String(rpm).padStart(5, "0");
        }
        // Shift light blinks above 12,800 rpm
        const wantShift = telemetry.rpm > 12800 && Math.floor(time * 10) % 2 === 0;
        if (wantShift !== shiftOn) {
          shiftOn = wantShift;
          shift.dataset.on = wantShift ? "true" : "false";
        }

        const speed = Math.round(telemetry.speed);
        if (speed !== lastSpeed) {
          lastSpeed = speed;
          speedText.textContent = String(speed).padStart(3, "0");
        }

        const lean = Math.round(telemetry.lean);
        if (lean !== lastLean) {
          lastLean = lean;
          const side = lean === 0 ? " " : lean < 0 ? "L" : "R";
          leanText.textContent = `${side} ${String(Math.abs(lean)).padStart(2, "0")}°`;
          horizon.setAttribute("transform", `rotate(${-lean} 20 20)`);
        }
      };
      gsap.ticker.add(tick);

      let glitch: gsap.core.Timeline | null = null;
      const off = onGearChange((gear, previous) => {
        glitch?.kill();
        const up = gear > previous;
        glitch = gsap
          .timeline()
          .to(digit, { yPercent: up ? -115 : 115, skewY: up ? -10 : 10, duration: 0.11, ease: "power2.in" })
          .call(() => setShown(gear))
          .set(digit, { yPercent: up ? 115 : -115 })
          .to(digit, { yPercent: 0, skewY: 0, duration: 0.42, ease: "expo.out" })
          .fromTo(ghost, { autoAlpha: 0.95, x: -5 }, { autoAlpha: 0, x: 0, duration: 0.32, ease: "steps(5)" }, "<")
          .fromTo(
            box,
            { backgroundColor: "rgba(255,42,0,0.38)" },
            { backgroundColor: "rgba(255,42,0,0)", duration: 0.55, ease: "power2.out" },
            "<",
          )
          .to(box, { keyframes: { x: [-3, 3, -2, 1, 0], easeEach: "none" }, duration: 0.24 }, "<");
      });

      return () => {
        gsap.ticker.remove(tick);
        off();
        glitch?.kill();
      };
    },
    { scope: root },
  );

  const current = GEARS[shown];

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-50 text-titanium">
      {/* Viewport frame corners */}
      {[
        "left-2 top-[calc(var(--hud-top)+8px)] border-l border-t",
        "right-2 top-[calc(var(--hud-top)+8px)] border-r border-t",
        "left-2 bottom-[calc(var(--hud-bottom)+8px)] border-l border-b",
        "right-2 bottom-[calc(var(--hud-bottom)+8px)] border-r border-b",
      ].map((c) => (
        <span key={c} aria-hidden className={`absolute h-4 w-4 border-titanium/35 ${c}`} />
      ))}

      {/* Top bar */}
      <header className="glass absolute inset-x-0 top-0 flex h-[var(--hud-top)] items-center justify-between border-x-0 border-t-0 px-gutter">
        <a
          href="#ignition"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("#ignition");
          }}
          className="pointer-events-auto flex items-baseline gap-2"
          aria-label="APEX MOTO, back to top"
        >
          <span className="font-display text-[1.45rem] uppercase leading-none tracking-[-0.01em]">Apex Moto</span>
          <span className="tft hidden text-steel sm:inline">Est. 2009</span>
        </a>

        <p className="tft hidden text-steel lg:block">
          <span className="text-redline">G{current.label}</span>
          <span className="mx-3 inline-block h-px w-6 bg-titanium/30 align-middle" />
          {current.name}
        </p>

        <div className="flex items-center gap-5">
          <nav aria-label="Sections" className="pointer-events-auto hidden md:block">
            <ol className="flex items-center">
              {GEARS.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(g.target)}
                    aria-label={`Gear ${g.label}: ${g.name}`}
                    aria-current={g.id === shown ? "step" : undefined}
                    className={`tft grid h-8 w-7 place-items-center transition-colors duration-200 ${
                      g.id === shown ? "bg-titanium text-asphalt" : "text-steel hover:text-titanium"
                    }`}
                  >
                    {g.label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <button
            type="button"
            onClick={() => scrollTo("#pit-stop")}
            className="tft chamfer-sm pointer-events-auto bg-redline px-4 py-2.5 font-bold text-asphalt transition-colors duration-200 hover:bg-titanium"
          >
            Book a ride
          </button>
        </div>
      </header>

      {/* Bottom instrument cluster */}
      <div
        className="glass absolute inset-x-0 bottom-0 grid h-[var(--hud-bottom)] grid-cols-[1fr_auto_auto] items-center gap-4 border-x-0 border-b-0 px-gutter md:grid-cols-[1fr_auto_auto_auto] md:gap-8"
        aria-hidden
      >
        {/* Tachometer */}
        <div className="min-w-0">
          <div className="tft mb-1 flex justify-between text-[0.5625rem] text-steel" aria-hidden>
            {SCALE.map((n) => (
              <span key={n} className={n >= 12 ? "text-redline" : ""}>
                {n}
              </span>
            ))}
          </div>
          <div className="relative h-3 md:h-[14px]" style={{ clipPath: WEDGE }} aria-hidden>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, rgb(255 255 255 / 0.09) 0 ${REDLINE_PCT}%, rgb(255 42 0 / 0.28) ${REDLINE_PCT}%)`,
                maskImage: SEGMENT_MASK,
                WebkitMaskImage: SEGMENT_MASK,
              }}
            />
            <div
              data-hud="fill"
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, #e2e4e9 0 ${REDLINE_PCT}%, #ff2a00 ${REDLINE_PCT}%)`,
                maskImage: SEGMENT_MASK,
                WebkitMaskImage: SEGMENT_MASK,
                clipPath: "inset(0 100% 0 0)",
              }}
            />
          </div>
          <div className="tft mt-1 flex items-center gap-2 text-[0.5625rem] text-steel">
            <span>RPM</span>
            <span data-hud="rpm" className="text-titanium tabular-nums">
              00000
            </span>
            <span
              data-hud="shift"
              data-on="false"
              className="ml-1 px-1.5 text-asphalt transition-none data-[on=false]:bg-transparent data-[on=false]:text-transparent data-[on=true]:bg-redline"
              aria-hidden
            >
              Shift
            </span>
          </div>
        </div>

        {/* Gear indicator */}
        <div
          data-hud="gearbox"
          className="relative grid h-[calc(var(--hud-bottom)-16px)] w-12 place-items-center overflow-hidden border border-hairline-strong md:w-14"
        >
          <span className="tft absolute left-1 top-0.5 text-[0.5rem] text-steel" aria-hidden>
            Gear
          </span>
          <span
            data-hud="digit"
            className="font-display text-[1.9rem] leading-none md:text-[2.3rem]"
            aria-hidden
          >
            {current.label}
          </span>
          <span
            data-hud="ghost"
            className="pointer-events-none invisible absolute inset-0 grid place-items-center font-display text-[1.9rem] leading-none text-redline opacity-0 mix-blend-screen md:text-[2.3rem]"
            aria-hidden
          >
            {current.label}
          </span>
        </div>

        {/* Speed */}
        <div className="text-right">
          <div className="font-display text-[1.7rem] leading-none tabular-nums md:text-[2rem]">
            <span data-hud="speed">000</span>
          </div>
          <div className="tft text-[0.5625rem] text-steel">km/h</div>
        </div>

        {/* Lean */}
        <div className="hidden items-center gap-3 md:flex">
          <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
            <circle cx="20" cy="20" r="18.5" fill="none" stroke="rgb(255 255 255 / 0.16)" />
            <g data-hud="horizon">
              <path d="M3 20h12M25 20h12" stroke="#ff2a00" strokeWidth="1.5" />
              <path d="M20 20v-7" stroke="#e2e4e9" strokeWidth="1" />
            </g>
            <circle cx="20" cy="20" r="1.6" fill="#e2e4e9" />
          </svg>
          <div>
            <div data-hud="lean" className="font-display text-[1.35rem] leading-none tabular-nums">
              {" "} 00°
            </div>
            <div className="tft text-[0.5625rem] text-steel">Lean</div>
          </div>
        </div>
      </div>
    </div>
  );
}
