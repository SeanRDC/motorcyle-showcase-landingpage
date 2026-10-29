import { useRef, type CSSProperties } from "react";
import { gsap, MOTION_CONDITIONS, useGSAP, type MotionConditions } from "../lib/gsap";
import { countTo } from "../lib/format";
import { ASSETS } from "../data/content";
import { Reticle } from "./ui/Reticle";

/** Figure coordinates are % of the photograph; the SVG uses a 1000-wide viewBox at the photo's aspect. */
const VB_W = 1000;
const VB_H = (1667 / 2400) * 1000;
const px = (x: number) => (x / 100) * VB_W;
const py = (y: number) => (y / 100) * VB_H;

type Point = { x: number; y: number };
type Callout = {
  id: string;
  phase: 1 | 2 | 3;
  anchor: Point;
  elbow: Point;
  end: Point;
  align: "left" | "right";
  kicker: string;
  value: string;
};

const CALLOUTS: Callout[] = [
  // Each label owns a distinct slot so all six can show at once in reduced-motion mode.
  { id: "engine", phase: 1, anchor: { x: 46, y: 64 }, elbow: { x: 36, y: 25 }, end: { x: 5, y: 25 }, align: "left", kicker: "Engine", value: "90° V4, 1,103 cc" },
  { id: "exhaust", phase: 1, anchor: { x: 42, y: 77 }, elbow: { x: 32, y: 93 }, end: { x: 5, y: 93 }, align: "left", kicker: "Exhaust", value: "Titanium 4-2-1" },
  { id: "wing", phase: 2, anchor: { x: 56, y: 56 }, elbow: { x: 64, y: 13 }, end: { x: 96, y: 13 }, align: "right", kicker: "Aero", value: "Biplane carbon winglets" },
  { id: "fork", phase: 2, anchor: { x: 63.5, y: 62 }, elbow: { x: 86, y: 40 }, end: { x: 99, y: 40 }, align: "right", kicker: "Suspension", value: "Öhlins NIX30, 43 mm" },
  { id: "caliper", phase: 3, anchor: { x: 66, y: 70 }, elbow: { x: 80, y: 93 }, end: { x: 98, y: 93 }, align: "right", kicker: "Brakes", value: "Brembo Stylema M4.30" },
  { id: "imu", phase: 3, anchor: { x: 57.5, y: 41 }, elbow: { x: 50, y: 10 }, end: { x: 14, y: 10 }, align: "left", kicker: "Electronics", value: "6-axis IMU" },
];

const FOCUS: Record<1 | 2 | 3, Point & { r: number }> = {
  1: { x: 46, y: 66, r: 15 },
  2: { x: 58, y: 54, r: 19 },
  3: { x: 66, y: 70, r: 12 },
};

const PHASES = [
  {
    n: 1 as const,
    name: "Powertrain",
    copy: "A 90° V4 with a counter-rotating crank. It pulls hardest past 9,000 rpm and keeps going to 14,500.",
    stats: [
      { to: 205, unit: "hp", note: "at 13,000 rpm" },
      { to: 112, unit: "Nm", note: "at 9,500 rpm" },
    ],
  },
  {
    n: 2 as const,
    name: "Chassis & aero",
    copy: "Biplane winglets press the front down on the exit, so the electronics step in less and the bike drives harder.",
    stats: [
      { to: 28, unit: "kg", note: "downforce at 270 km/h" },
      { to: 178, unit: "kg", note: "dry weight" },
    ],
  },
  {
    n: 3 as const,
    name: "Electronics & braking",
    copy: "The IMU reads lean, pitch and yaw a hundred times a second and adjusts traction, slide and ABS to the angle you're at.",
    stats: [
      { to: 330, unit: "mm", note: "twin front discs" },
      { to: 100, unit: "Hz", note: "IMU sample rate" },
    ],
  },
];

const BADGES = ["TC 4", "Slide 2", "Wheelie 2", "Cornering ABS", "Engine brake 2", "Launch armed"];

// Wind-tunnel streamlines, flowing from the nose (right) to the tail (left).
const STREAMS = [
  "M1000 150 C 820 150 700 128 560 146 S 300 168 0 160",
  "M1000 214 C 830 214 720 176 610 198 S 400 232 0 220",
  "M1000 282 C 860 282 740 250 650 262 S 450 300 0 288",
  "M1000 350 C 880 350 760 330 690 344 S 520 392 0 372",
  "M1000 420 C 890 420 800 410 720 428 S 560 470 0 452",
  "M1000 498 C 900 498 820 494 760 504 S 600 540 0 526",
  "M1000 576 C 900 576 840 572 780 580 S 620 606 0 600",
];

const pathFor = (c: Callout) =>
  `M${px(c.anchor.x)} ${py(c.anchor.y)}L${px(c.elbow.x)} ${py(c.elbow.y)}L${px(c.end.x)} ${py(c.end.y)}`;

export function BikeDeconstruction() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION_CONDITIONS, (ctx) => {
        const { motion } = ctx.conditions as MotionConditions;
        const spot = q(".spotlight")[0] as HTMLElement;
        const reticle = q(".fig-reticle")[0] as HTMLElement;

        if (!motion) {
          // Reduced motion: static annotated blueprint, every callout and stat visible.
          gsap.set(q(".callout-line"), { strokeDashoffset: 0 });
          gsap.set(q(".callout-label, .badge, .phase-copy, .anchor-dot"), { autoAlpha: 1 });
          gsap.set(q(".phase-copy"), { position: "relative" });
          gsap.set(q(".rail-fill"), { scaleX: 1 });
          gsap.set(spot, { autoAlpha: 0 });
          gsap.set(reticle, { autoAlpha: 0 });
          q(".cnt").forEach((el) => (el.textContent = (el as HTMLElement).dataset.to ?? ""));
          return;
        }

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: q(".anatomy-pin")[0],
            start: "top top",
            end: "+=250%",
            pin: true,
            scrub: 0.8,
          },
        });

        const phaseAt = (p: 1 | 2 | 3) => (p - 1) * 3;
        gsap.set(q(".reticle-ring"), { svgOrigin: "50 50" });

        PHASES.forEach(({ n }) => {
          const t0 = phaseAt(n);
          const f = FOCUS[n];
          const copy = q(`.phase-copy[data-phase="${n}"]`);

          // Focus shift: spotlight + reticle travel to this phase's part
          tl.to(spot, { "--sx": `${f.x}%`, "--sy": `${f.y}%`, "--sr": `${f.r}%`, duration: 0.9 }, t0)
            .to(reticle, { left: `${f.x}%`, top: `${f.y}%`, autoAlpha: 1, duration: 0.9 }, t0)
            .fromTo(q(".reticle-ring"), { rotation: (n - 1) * 120 }, { rotation: n * 120, duration: 3, ease: "none", immediateRender: false }, t0)
            .fromTo(q(`.rail-fill[data-phase="${n}"]`), { scaleX: 0 }, { scaleX: 1, duration: 3, ease: "none" }, t0)
            .to(q(`.rail-label[data-phase="${n}"]`), { color: "#e2e4e9", duration: 0.2 }, t0);

          if (n > 1) {
            tl.fromTo(copy, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, t0 + 0.1);
          }

          // Callouts for this phase draw on, staggered
          CALLOUTS.filter((c) => c.phase === n).forEach((c, i) => {
            const at = t0 + 0.3 + i * 0.35;
            tl.fromTo(
              q(`.anchor-dot[data-id="${c.id}"]`),
              { autoAlpha: 0, scale: 0, transformOrigin: "50% 50%" },
              { autoAlpha: 1, scale: 1, transformOrigin: "50% 50%", duration: 0.25, ease: "back.out(3)" },
              at,
            )
              .fromTo(q(`.callout-line[data-id="${c.id}"]`), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out" }, at)
              .fromTo(
                q(`.callout-label[data-id="${c.id}"]`),
                { autoAlpha: 0, x: c.align === "left" ? -16 : 16 },
                { autoAlpha: 1, x: 0, duration: 0.5, ease: "power3.out" },
                at + 0.55,
              );
          });

          // Counters tick with the scroll
          q(`.phase-copy[data-phase="${n}"] .cnt`).forEach((el, i) => {
            tl.add(countTo(el, Number((el as HTMLElement).dataset.to), { duration: 1.3, ease: "power1.out" }), t0 + 0.25 + i * 0.2);
          });

          // Exit (not for the last phase, which holds until the pin releases)
          if (n < 3) {
            const out = t0 + 2.55;
            tl.to(q(`.callout-label[data-phase="${n}"]`), { autoAlpha: 0, duration: 0.3 }, out)
              .to(q(`.callout-line[data-phase="${n}"]`), { strokeDashoffset: -1, duration: 0.4, ease: "power2.in" }, out)
              .to(q(`.anchor-dot[data-phase="${n}"]`), { autoAlpha: 0, duration: 0.2 }, out + 0.2)
              .to(copy, { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in" }, out)
              .to(q(`.rail-label[data-phase="${n}"]`), { color: "#71717a", duration: 0.2 }, out + 0.4);
          }
        });

        // Phase 2: wind-tunnel airflow with three parallax depths
        tl.to(q(".airflow"), { autoAlpha: 1, duration: 0.5 }, 3.1)
          .fromTo(q(".stream"), { strokeDashoffset: 0 }, { strokeDashoffset: -900, duration: 2.8, ease: "none" }, 3.1)
          .fromTo(q(".flow-near"), { x: 40 }, { x: -60, duration: 2.8, ease: "none" }, 3.1)
          .fromTo(q(".flow-mid"), { x: 20 }, { x: -30, duration: 2.8, ease: "none" }, 3.1)
          .fromTo(q(".flow-far"), { x: 8 }, { x: -12, duration: 2.8, ease: "none" }, 3.1)
          .to(q(".airflow"), { autoAlpha: 0, duration: 0.4 }, 5.6);

        // Phase 3: staggered electronics badges
        tl.fromTo(
          q(".badge"),
          { autoAlpha: 0, x: 18 },
          { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.22, ease: "steps(3)" },
          6.6,
        );

        // Subtle push-in on the bike across the whole sequence
        tl.fromTo(q(".fig-photo"), { scale: 1 }, { scale: 1.06, duration: 9, ease: "none" }, 0);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="anatomy" data-gear="2" aria-labelledby="anatomy-title" className="relative">
      <div className="anatomy-pin blueprint relative overflow-hidden motion-safe:h-svh">
        <div className="relative z-[1] grid h-full grid-rows-[auto_1fr] gap-4 px-gutter pb-[calc(var(--hud-bottom)+20px)] pt-[calc(var(--hud-top)+24px)] md:grid-cols-12 md:grid-rows-1 md:gap-8 motion-reduce:py-[16vh]">
          {/* Copy column */}
          <div className="order-2 flex min-h-0 flex-col justify-center md:order-1 md:col-span-4">
            <h2 id="anatomy-title" className="display text-[clamp(2.6rem,6.4vw,6.5rem)]">
              Anatomy
              <br />
              of speed
            </h2>

            {/* Phase rail: a real sequence through the pinned scroll */}
            <ol className="mt-6 grid grid-cols-3 gap-2 md:mt-10" aria-label="Phases">
              {PHASES.map((p) => (
                <li key={p.n}>
                  <div className="h-[3px] bg-hairline-strong">
                    <div data-phase={p.n} className="rail-fill h-full origin-left scale-x-0 bg-redline" />
                  </div>
                  <span data-phase={p.n} className="rail-label tft mt-2 block text-[0.5625rem] text-steel">
                    {p.n}. {p.name}
                  </span>
                </li>
              ))}
            </ol>

            <div className="relative mt-6 min-h-[190px] md:mt-10 md:min-h-[260px] motion-reduce:min-h-0 motion-reduce:space-y-10">
              {PHASES.map((p) => (
                <div
                  key={p.n}
                  data-phase={p.n}
                  className={`phase-copy absolute inset-x-0 top-0 ${p.n === 1 ? "" : "invisible opacity-0"}`}
                >
                  <h3 className="display text-[clamp(1.9rem,3.4vw,3.4rem)] text-titanium">{p.name}</h3>
                  <p className="mt-3 max-w-[42ch] text-[0.875rem] leading-relaxed text-titanium/70">{p.copy}</p>
                  <dl className="mt-6 grid max-w-sm grid-cols-2 border-t border-hairline-strong">
                    {p.stats.map((s) => (
                      <div key={s.unit + s.note} className="border-r border-hairline pt-3 last:border-r-0 last:pl-4">
                        <dd className="flex items-baseline gap-1.5">
                          <span data-to={s.to} className="cnt font-display text-[clamp(2.6rem,4.6vw,4.4rem)] leading-none tabular-nums">
                            0
                          </span>
                          <span className="font-display text-xl text-redline">{s.unit}</span>
                        </dd>
                        <dt className="tft mt-1 text-[0.5625rem] text-steel">{s.note}</dt>
                      </div>
                    ))}
                  </dl>
                  {p.n === 3 && (
                    <ul className="mt-5 hidden flex-wrap gap-1.5 motion-reduce:flex" aria-label="Rider aids">
                      {BADGES.map((b) => (
                        <li key={b} className="tft glass px-2 py-1 text-[0.5625rem] text-titanium">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Annotated figure */}
          <div className="order-1 flex min-h-0 items-center md:order-2 md:col-span-8">
            <figure className="relative w-full" style={{ aspectRatio: "2400 / 1667" }}>
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={ASSETS.anatomy}
                  alt="Red V4 hyper-naked motorcycle in side profile inside a curved tunnel"
                  loading="lazy"
                  decoding="async"
                  className="fig-photo absolute inset-0 h-full w-full object-cover [filter:saturate(0.9)_brightness(0.92)]"
                  style={{
                    maskImage: "radial-gradient(ellipse 72% 72% at 54% 58%, #000 52%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 72% 72% at 54% 58%, #000 52%, transparent 100%)",
                  }}
                />
              </div>

              {/* Focus spotlight */}
              <div
                aria-hidden
                className="spotlight pointer-events-none absolute inset-0"
                style={
                  {
                    "--sx": "54%",
                    "--sy": "58%",
                    "--sr": "70%",
                    background:
                      "radial-gradient(circle at var(--sx) var(--sy), transparent 0 var(--sr), rgb(10 10 12 / 0.66) calc(var(--sr) + 16%))",
                  } as CSSProperties
                }
              />

              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                aria-hidden
              >
                {/* Airflow */}
                <g className="airflow invisible opacity-0" fill="none" stroke="#e2e4e9" strokeLinecap="round">
                  {STREAMS.map((d, i) => (
                    <g key={d} className={i % 3 === 0 ? "flow-near" : i % 3 === 1 ? "flow-mid" : "flow-far"}>
                      <path
                        className="stream"
                        d={d}
                        strokeWidth={i % 3 === 0 ? 1.4 : 1}
                        strokeOpacity={i % 3 === 0 ? 0.55 : i % 3 === 1 ? 0.35 : 0.2}
                        strokeDasharray={i % 2 ? "70 26 14 26" : "120 30"}
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  ))}
                </g>

                {/* Callout lines + anchors */}
                {CALLOUTS.map((c) => (
                  <g key={c.id}>
                    <path
                      data-id={c.id}
                      data-phase={c.phase}
                      className="callout-line"
                      d={pathFor(c)}
                      pathLength={1}
                      strokeDasharray="1 1"
                      strokeDashoffset={1}
                      fill="none"
                      stroke="#ff2a00"
                      strokeWidth="1.25"
                      vectorEffect="non-scaling-stroke"
                    />
                    <g data-id={c.id} data-phase={c.phase} className="anchor-dot invisible opacity-0">
                      <circle cx={px(c.anchor.x)} cy={py(c.anchor.y)} r="9" fill="none" stroke="#ff2a00" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
                      <circle cx={px(c.anchor.x)} cy={py(c.anchor.y)} r="3.5" fill="#ff2a00" />
                    </g>
                  </g>
                ))}
              </svg>

              {/* Labels */}
              {CALLOUTS.map((c) => (
                <div
                  key={c.id}
                  data-id={c.id}
                  data-phase={c.phase}
                  className={`callout-label invisible absolute w-max max-w-[38%] -translate-y-full pb-1.5 opacity-0 ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                  style={
                    c.align === "right"
                      ? { right: `${100 - c.end.x}%`, top: `${c.end.y}%` }
                      : { left: `${c.end.x}%`, top: `${c.end.y}%` }
                  }
                >
                  <span className="tft block text-[0.5rem] text-redline md:text-[0.5625rem]">{c.kicker}</span>
                  <span className="mt-0.5 block font-display text-[0.8rem] uppercase leading-tight text-titanium md:text-[1.15rem]">
                    {c.value}
                  </span>
                </div>
              ))}

              {/* Electronics badges */}
              <ul className="absolute right-0 top-[24%] flex flex-col items-end gap-1.5 motion-reduce:hidden" aria-label="Rider aids">
                {BADGES.map((b) => (
                  <li
                    key={b}
                    className="badge tft glass invisible px-2 py-1 text-[0.5rem] text-titanium opacity-0 md:text-[0.5625rem]"
                  >
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 bg-redline align-middle" />
                    {b}
                  </li>
                ))}
              </ul>

              {/* Reticle */}
              <div
                aria-hidden
                className="fig-reticle invisible absolute w-[13%] -translate-x-1/2 -translate-y-1/2 text-redline opacity-0"
                style={{ left: "54%", top: "58%", aspectRatio: "1" }}
              >
                <Reticle className="h-full w-full" />
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
