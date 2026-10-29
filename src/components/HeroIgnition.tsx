import { useRef } from "react";
import { KeyRound } from "lucide-react";
import { gsap, MOTION_CONDITIONS, useGSAP, type MotionConditions } from "../lib/gsap";
import { MAX_RPM, REDLINE_RPM, telemetry } from "../lib/telemetry";
import { ASSETS } from "../data/content";
import { LocalGridLines } from "./ui/Atmosphere";

// Tach dial geometry: 270deg sweep from 7:30 to 4:30 o'clock, centre (100,100).
const ARC_START = 135;
const ARC_SWEEP = 270;
const toXY = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)] as const;
};
const arcPath = (r: number, from: number, to: number) => {
  const [x0, y0] = toXY(from, r);
  const [x1, y1] = toXY(to, r);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
const rpmToDeg = (rpm: number) => ARC_START + (rpm / MAX_RPM) * ARC_SWEEP;

const BOOT_LOG: [string, string][] = [
  ["Key on", "OK"],
  ["ECU APX-V4 rev 2.6", "OK"],
  ["IMU 6-axis calibration", "OK"],
  ["Cornering ABS", "Armed"],
  ["TC 4 / Slide 2 / Wheelie 2", "Set"],
  ["Fuel 17.0 L", "98%"],
];

// LED lamp centres as % of the hero photograph (measured on the source image).
const LAMPS = [
  { left: "23.7%", top: "42.2%" },
  { left: "24.9%", top: "44.6%" },
];

export function HeroIgnition() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const dialFill = root.current!.querySelector<SVGPathElement>("[data-dial=fill]")!;
      const needle = root.current!.querySelector<SVGLineElement>("[data-dial=needle]")!;
      const readout = q("[data-dial=readout]")[0] as HTMLElement;
      const proxy = { rpm: 0 };

      const renderDial = () => {
        const f = proxy.rpm / MAX_RPM;
        dialFill.style.strokeDashoffset = String(1 - f);
        needle.setAttribute("transform", `rotate(${rpmToDeg(proxy.rpm)} 100 100)`);
        readout.textContent = String(Math.round(proxy.rpm)).padStart(5, "0");
        readout.dataset.red = proxy.rpm >= REDLINE_RPM ? "true" : "false";
      };

      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (ctx) => {
        const { motion } = ctx.conditions as MotionConditions;

        if (!motion) {
          // Reduced motion: no pin and no sweep. Show the lit bike, lamps on, at idle.
          proxy.rpm = 1150;
          renderDial();
          gsap.set(q(".darkness"), { autoAlpha: 0 });
          gsap.set(q(".studio"), { autoAlpha: 1 });
          gsap.set(q(".led"), { scale: 1 });
          gsap.set(q(".flare-streak"), { scaleX: 1, autoAlpha: 0.6 });
          gsap.set(q(".boot-line, .boot-ring, .hero-copy, .n-lamp"), { autoAlpha: 1 });
          gsap.set(q(".k-line"), { autoAlpha: 0.18 });
          gsap.set(q(".prompt"), { autoAlpha: 0 });
          return;
        }

        // Engine off at the top of the page.
        telemetry.rpmOverride = 0;
        renderDial();

        // One orchestrated load moment: the type rises out of the dark, the bike's rim light fades up.
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .from(q(".k-inner"), { yPercent: 105, duration: 1.4, stagger: 0.12 }, 0.15)
          .from(q(".bike-img"), { autoAlpha: 0, duration: 2.2, ease: "power2.inOut" }, 0)
          .from(q(".prompt"), { autoAlpha: 0, y: 12, duration: 0.8 }, 1.1);

        // Scrub keeps rendering briefly after onLeave; only own the tach while the pin is active.
        const driveRpm = () => {
          renderDial();
          if (tl.scrollTrigger?.isActive || window.scrollY < 1) telemetry.rpmOverride = proxy.rpm;
        };

        const tl: gsap.core.Timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: q(".hero-pin")[0],
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 0.6,
            onLeave: () => {
              telemetry.rpmOverride = null;
            },
            onEnterBack: () => {
              telemetry.rpmOverride = proxy.rpm;
            },
          },
        });

        tl.to(q(".prompt"), { autoAlpha: 0, y: -10, duration: 0.5 }, 0)
          // TFT boot
          .to(q(".boot-ring"), { autoAlpha: 1, duration: 0.6 }, 0.1)
          .fromTo(q(".dial-track"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2 }, 0.2)
          .to(q(".boot-line"), { autoAlpha: 1, duration: 0.25, stagger: 0.28, ease: "steps(2)" }, 0.3)
          .to(q(".n-lamp"), { autoAlpha: 1, duration: 0.2 }, 0.5)
          // Needle sweep to the limiter and back to idle
          .to(proxy, { rpm: MAX_RPM, duration: 2.4, ease: "power1.in", onUpdate: driveRpm }, 1.1)
          .to(proxy, { rpm: 1150, duration: 1.3, ease: "power2.out", onUpdate: driveRpm }, 3.5)
          // Dual LED headlights flare
          .to(q(".led"), { scale: 1, duration: 0.7, stagger: 0.12, ease: "back.out(2.4)" }, 3.4)
          .fromTo(q(".flare-streak"), { scaleX: 0, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, duration: 0.8, ease: "expo.out" }, 3.55)
          .to(q(".beam"), { opacity: 1, duration: 0.9 }, 3.6)
          .to(q(".flare-streak"), { autoAlpha: 0.45, duration: 1 }, 4.6)
          // Kinetic split, studio lighting, scale-up
          .to(q(".k-line-a"), { xPercent: -58, duration: 5.4, ease: "power1.in" }, 4.4)
          .to(q(".k-line-b"), { xPercent: 58, duration: 5.4, ease: "power1.in" }, 4.4)
          .fromTo(q(".stage"), { scale: 0.9 }, { scale: 1.08, duration: 5.6 }, 4.4)
          .to(q(".darkness"), { autoAlpha: 0, duration: 3.6, ease: "power2.inOut" }, 4.6)
          .to(q(".studio"), { autoAlpha: 1, duration: 3.2, ease: "power2.inOut" }, 5)
          .to(q(".beam"), { opacity: 0.45, duration: 2 }, 6)
          .to(proxy, { rpm: 6200, duration: 5, ease: "power1.in", onUpdate: driveRpm }, 5)
          .to(q(".boot-ring"), { autoAlpha: 0.35, duration: 1.5 }, 7)
          .fromTo(q(".hero-copy"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.6, ease: "power3.out" }, 8.4);

        return () => {
          telemetry.rpmOverride = null;
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const ticks = Array.from({ length: 15 }, (_, k) => {
    const deg = ARC_START + (ARC_SWEEP * k) / 14;
    const major = k % 2 === 0;
    const [x0, y0] = toXY(deg, major ? 64 : 68);
    const [x1, y1] = toXY(deg, 74);
    const [lx, ly] = toXY(deg, 53);
    return { k, major, x0, y0, x1, y1, lx, ly, red: k >= 12 };
  });

  return (
    <section ref={root} id="ignition" data-gear="1" aria-labelledby="hero-title" className="relative">
      <div className="hero-pin relative h-svh overflow-hidden bg-asphalt">
        <LocalGridLines />

        {/* Bike stage */}
        <div
          className="stage absolute left-1/2 top-[52%] aspect-[2000/1489] w-[150vw] -translate-x-[51%] -translate-y-[53%] will-change-transform md:w-[min(94vw,170svh)]"
          aria-hidden
        >
          <img
            src={ASSETS.hero}
            alt=""
            className="bike-img absolute inset-0 h-full w-full object-contain mix-blend-lighten"
            fetchPriority="high"
            decoding="async"
          />
          {/* Overhead studio key light + floor bounce, revealed at the end */}
          <div
            className="studio invisible absolute inset-0 opacity-0 mix-blend-screen"
            style={{
              background:
                "radial-gradient(42% 30% at 52% 30%, rgb(226 228 233 / 0.16), transparent 70%), radial-gradient(40% 9% at 51% 77%, rgb(255 255 255 / 0.13), transparent 75%), radial-gradient(30% 22% at 50% 55%, rgb(255 42 0 / 0.07), transparent 70%)",
            }}
          />
          <div className="darkness absolute inset-0 bg-asphalt/80" />
          <div className="beam" />
          <div className="flare-streak invisible" style={{ left: "24.2%", top: "43.4%" }} />
          {LAMPS.map((lamp) => (
            <span key={lamp.top} className="led" style={lamp} />
          ))}
        </div>

        {/* Kinetic headline, in front of the bike; it splits apart to reveal it */}
        <h1
          id="hero-title"
          className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 select-none flex-col px-gutter"
        >
          <span className="k-line k-line-a block overflow-hidden will-change-transform">
            <span className="k-inner display block whitespace-nowrap text-[clamp(4.25rem,15.4vw,17rem)] text-titanium">
              Unleash the
            </span>
          </span>{" "}
          <span className="k-line k-line-b block self-end overflow-hidden will-change-transform">
            <span className="k-inner display block whitespace-nowrap text-[clamp(4.25rem,15.4vw,17rem)] text-titanium">
              Machine
            </span>
          </span>
        </h1>

        {/* TFT boot log */}
        <ol
          className="tft absolute left-[var(--gutter)] top-[calc(var(--hud-top)+28px)] w-[min(78vw,330px)] space-y-1.5 text-[0.625rem] text-steel"
          aria-label="Ignition self-check"
        >
          {BOOT_LOG.map(([item, state]) => (
            <li key={item} className="boot-line invisible flex items-baseline gap-2 opacity-0">
              <span className="text-titanium/60">&gt;</span>
              <span className="text-titanium/90">{item}</span>
              <span className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-titanium/20" />
              <span className={state === "Armed" ? "text-redline" : "text-titanium"}>{state}</span>
            </li>
          ))}
        </ol>

        {/* TFT tach dial */}
        <div
          className="boot-ring invisible absolute right-[var(--gutter)] top-[calc(var(--hud-top)+18px)] w-[128px] opacity-0 md:w-[176px]"
          aria-hidden
        >
          <svg viewBox="0 0 200 200" className="w-full overflow-visible">
            <path
              className="dial-track"
              d={arcPath(80, ARC_START, ARC_START + ARC_SWEEP)}
              pathLength={1}
              strokeDasharray="1 1"
              fill="none"
              stroke="rgb(255 255 255 / 0.14)"
              strokeWidth="1"
            />
            <path
              d={arcPath(80, rpmToDeg(REDLINE_RPM), ARC_START + ARC_SWEEP)}
              fill="none"
              stroke="#ff2a00"
              strokeOpacity="0.5"
              strokeWidth="5"
            />
            <path
              data-dial="fill"
              d={arcPath(80, ARC_START, ARC_START + ARC_SWEEP)}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset="1"
              fill="none"
              stroke="#e2e4e9"
              strokeWidth="5"
            />
            {ticks.map((t) => (
              <g key={t.k}>
                <line
                  x1={t.x0}
                  y1={t.y0}
                  x2={t.x1}
                  y2={t.y1}
                  stroke={t.red ? "#ff2a00" : "#e2e4e9"}
                  strokeOpacity={t.major ? 0.9 : 0.4}
                  strokeWidth={t.major ? 1.5 : 1}
                />
                {t.major && (
                  <text
                    x={t.lx}
                    y={t.ly}
                    fill={t.red ? "#ff2a00" : "#71717a"}
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {t.k}
                  </text>
                )}
              </g>
            ))}
            <line data-dial="needle" x1="100" y1="100" x2="172" y2="100" stroke="#ff2a00" strokeWidth="2" />
            <circle cx="100" cy="100" r="5" fill="#141418" stroke="#ff2a00" strokeWidth="1.5" />
          </svg>
          <div className="-mt-8 text-center md:-mt-10">
            <div
              data-dial="readout"
              data-red="false"
              className="font-display text-[1.35rem] leading-none tabular-nums text-titanium data-[red=true]:text-redline md:text-[1.75rem]"
            >
              00000
            </div>
            <div className="tft mt-1 flex items-center justify-center gap-2 text-[0.5625rem] text-steel">
              r/min
              <span className="n-lamp invisible bg-[#4af626] px-1 font-bold text-asphalt opacity-0">N</span>
            </div>
          </div>
        </div>

        {/* Pre-ignition prompt */}
        <div className="prompt absolute bottom-[calc(var(--hud-bottom)+28px)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-center">
          <KeyRound className="h-5 w-5 text-redline" strokeWidth={1.5} aria-hidden />
          <p className="tft text-titanium">Turn the key</p>
          <p className="tft text-[0.5625rem] text-steel">Scroll to start the engine</p>
        </div>

        {/* Closing copy once the lights are up */}
        <div className="hero-copy invisible absolute bottom-[calc(var(--hud-bottom)+28px)] left-[var(--gutter)] max-w-[34ch] opacity-0">
          <p className="text-[0.9375rem] leading-relaxed text-titanium/85">
            Supersport, naked, adventure and cafe motorcycles, set up in our own workshop and ready for you to
            test ride.
          </p>
        </div>
      </div>
    </section>
  );
}
