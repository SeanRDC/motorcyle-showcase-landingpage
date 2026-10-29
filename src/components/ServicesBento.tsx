import { useMemo, useRef, useState } from "react";
import { gsap, MOTION_CONDITIONS, ScrollTrigger, useGSAP, type MotionConditions } from "../lib/gsap";
import { ASSETS } from "../data/content";

// ---- Dyno chart -------------------------------------------------------------
const CHART = { w: 520, h: 220, rpmMin: 3000, rpmMax: 14500, hpMax: 220 };

function powerCurve(peakHp: number, peakRpm: number) {
  const pts: string[] = [];
  for (let rpm = CHART.rpmMin; rpm <= CHART.rpmMax; rpm += 250) {
    const rise = Math.sin((Math.PI / 2) * Math.min(1, (rpm - 2000) / (peakRpm - 2000))) ** 1.25;
    const fall = rpm > peakRpm ? 1 - ((rpm - peakRpm) / 4000) ** 2 * 0.9 : 1;
    const hp = peakHp * rise * fall;
    const x = ((rpm - CHART.rpmMin) / (CHART.rpmMax - CHART.rpmMin)) * CHART.w;
    const y = CHART.h - (hp / CHART.hpMax) * CHART.h;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join("L")}`;
}

const STOCK = powerCurve(194, 13000);
const TUNED = powerCurve(205.4, 13250);

// ---- Finance ---------------------------------------------------------------
const PRICE = 24990;
const DEPOSIT = 0.1;
const APR = 0.049;
const TERMS = [24, 36, 48, 60] as const;
const monthly = (months: number) => {
  const principal = PRICE * (1 - DEPOSIT);
  const r = APR / 12;
  return (principal * r) / (1 - (1 + r) ** -months);
};
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const DEFAULT_TERM = 48;
// Rendered once; GSAP owns the text node after that so React never fights the tween.
const INITIAL_PAYMENT = usd.format(monthly(DEFAULT_TERM));

// ---- Service desk hours (0 = Sunday) ----------------------------------------
const HOURS: { label: string; days: number[]; open?: [number, number] }[] = [
  { label: "Tue to Fri", days: [2, 3, 4, 5], open: [8, 19] },
  { label: "Saturday", days: [6], open: [8, 16] },
  { label: "Sun, Mon", days: [0, 1] },
];

function deskStatus(now: Date) {
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const today = HOURS.find((h) => h.days.includes(day));
  if (today?.open && hour >= today.open[0] && hour < today.open[1]) {
    return { open: true, text: `Open now, until ${String(today.open[1]).padStart(2, "0")}:00` };
  }
  return { open: false, text: "Closed now. Book online and we'll call you back." };
}

export function ServicesBento() {
  const root = useRef<HTMLElement>(null);
  const payment = useRef<HTMLSpanElement>(null);
  const [term, setTerm] = useState<(typeof TERMS)[number]>(DEFAULT_TERM);
  const status = useMemo(() => deskStatus(new Date()), []);

  const { contextSafe } = useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION_CONDITIONS, (ctx) => {
        const { motion } = ctx.conditions as MotionConditions;
        if (!motion) {
          gsap.set(q(".dyno-line"), { strokeDashoffset: 0 });
          return;
        }

        // Sharp clip-mask reveal, batched so neighbours cascade together
        const cells = q(".bento-cell");
        gsap.set(cells, { clipPath: "inset(100% 0% 0% 0%)" });
        ScrollTrigger.batch(cells, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: "expo.inOut", stagger: 0.14 }),
        });

        // Vertical parallax inside each photo cell
        q(".bento-img").forEach((img) => {
          gsap.fromTo(
            img,
            { yPercent: -15 },
            {
              yPercent: 15,
              ease: "none",
              scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        // Dyno curves plot themselves once the chart is in view
        gsap.fromTo(
          q(".dyno-line"),
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            duration: 1.6,
            ease: "power2.inOut",
            stagger: 0.35,
            scrollTrigger: { trigger: q(".dyno-chart")[0], start: "top 80%", toggleActions: "play none none reverse" },
          },
        );
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const chooseTerm = contextSafe((next: (typeof TERMS)[number]) => {
    const from = monthly(term);
    setTerm(next);
    const proxy = { v: from };
    gsap.to(proxy, {
      v: monthly(next),
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.6,
      ease: "power3.out",
      overwrite: true,
      onUpdate: () => {
        if (payment.current) payment.current.textContent = usd.format(proxy.v);
      },
    });
  });

  return (
    <section ref={root} id="services" data-gear="4" aria-labelledby="services-title" className="relative pb-[8vh] pt-[18vh]">
      <div className="px-gutter">
        <header className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="services-title" className="display text-[clamp(3rem,8.5vw,9rem)] md:col-span-8">
            Why riders
            <br />
            buy here
          </h2>
          <p className="max-w-[40ch] text-[0.9375rem] leading-relaxed text-titanium/70 md:col-span-4 md:pb-3">
            Every bike we sell goes through the workshop that preps our race bikes. These services come with it.
          </p>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-px border border-hairline bg-hairline md:mt-20 md:grid-cols-12">
          {/* Dyno lab */}
          <article className="bento-cell relative min-h-[560px] overflow-hidden bg-asphalt md:col-span-7 md:row-span-2 md:min-h-[720px]">
            <img
              src={ASSETS.dyno}
              alt="Close-up of a motorcycle engine with a gold clutch cover"
              loading="lazy"
              decoding="async"
              className="bento-img absolute inset-x-0 -top-[22.5%] h-[145%] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-asphalt/85 via-asphalt/30 to-asphalt/95" />
            <div className="relative flex h-full flex-col p-6 md:p-10">
              <h3 className="display text-[clamp(2.4rem,4.6vw,4.6rem)]">Dyno tuning lab</h3>
              <p className="mt-4 max-w-[40ch] text-[0.875rem] leading-relaxed text-titanium/75">
                Two dyno cells, a custom map for your exhaust and intake, and a printed power sheet before and after.
                You see every horsepower you pay for.
              </p>

              <figure className="dyno-chart glass mt-auto p-4 md:p-5">
                <figcaption className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="font-display text-[2rem] leading-none text-redline md:text-[2.6rem]">+11.4 hp</span>
                  <span className="tft text-[0.5625rem] text-steel">Average gain after map, 2025</span>
                </figcaption>
                <svg viewBox={`0 0 ${CHART.w} ${CHART.h + 24}`} className="mt-4 w-full overflow-visible" role="img" aria-label="Power curve: stock map peaks at 194 hp, Apex map peaks at 205 hp">
                  {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                    <line key={f} x1="0" x2={CHART.w} y1={CHART.h * f} y2={CHART.h * f} stroke="rgb(255 255 255 / 0.08)" />
                  ))}
                  {[4, 6, 8, 10, 12, 14].map((k) => {
                    const x = ((k * 1000 - CHART.rpmMin) / (CHART.rpmMax - CHART.rpmMin)) * CHART.w;
                    return (
                      <text key={k} x={x} y={CHART.h + 18} fill="#71717a" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                        {k}k
                      </text>
                    );
                  })}
                  <path className="dyno-line" d={STOCK} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} fill="none" stroke="#71717a" strokeWidth="1.5" />
                  <path className="dyno-line" d={TUNED} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} fill="none" stroke="#ff2a00" strokeWidth="2" />
                </svg>
                <div className="tft mt-3 flex gap-5 text-[0.5625rem] text-steel">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-px w-5 bg-steel" /> Stock map
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-0.5 w-5 bg-redline" /> Apex map
                  </span>
                </div>
              </figure>
            </div>
          </article>

          {/* Track day */}
          <article className="bento-cell relative min-h-[360px] overflow-hidden bg-asphalt md:col-span-5">
            <img
              src={ASSETS.track}
              alt="A pack of superbike racers leaning into a corner"
              loading="lazy"
              decoding="async"
              className="bento-img absolute inset-x-0 -top-[22.5%] h-[145%] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-asphalt via-asphalt/55 to-asphalt/10" />
            <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
              <p className="tft text-redline">Next date: Sat 14 Nov</p>
              <h3 className="display mt-3 text-[clamp(2rem,3.4vw,3.4rem)]">Track-day prep & support</h3>
              <p className="mt-3 max-w-[42ch] text-[0.8125rem] leading-relaxed text-titanium/75">
                We trailer your bike to the circuit, fit slicks and warmers, and run a pit box with fuel and a mechanic
                all day.
              </p>
            </div>
          </article>

          {/* Parts */}
          <article className="bento-cell relative min-h-[360px] overflow-hidden bg-asphalt md:col-span-5">
            <img
              src={ASSETS.parts}
              alt="Brembo brake caliper with a carbon cooling duct on a front wheel"
              loading="lazy"
              decoding="async"
              className="bento-img absolute inset-x-0 -top-[22.5%] h-[145%] w-full object-cover object-[50%_40%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-asphalt via-asphalt/70 to-transparent" />
            <div className="relative flex h-full max-w-[62%] flex-col justify-end p-6 md:p-8">
              <p className="tft text-steel">2,400 parts on the shelf</p>
              <h3 className="display mt-3 text-[clamp(2rem,3.4vw,3.4rem)]">Bespoke performance parts</h3>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-titanium/75">
                Brakes, exhausts, rear-sets and carbon, fitted and torqued by the tech who rides it after.
              </p>
            </div>
          </article>

          {/* Finance (typographic, interactive) */}
          <article className="bento-cell relative bg-carbon p-6 md:col-span-8 md:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <h3 className="display text-[clamp(2rem,3.6vw,3.6rem)]">Instant rider financing</h3>
                <p className="mt-3 max-w-[46ch] text-[0.8125rem] leading-relaxed text-titanium/70">
                  A decision in ten minutes, while you're still sitting on the bike. Pick a term to see the monthly cost
                  of an RR-999 Redline at {usd.format(PRICE)}.
                </p>
                <div role="radiogroup" aria-label="Finance term" className="mt-6 inline-grid grid-cols-4 border border-hairline-strong">
                  {TERMS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={t === term}
                      onClick={() => chooseTerm(t)}
                      className={`tft px-4 py-3 transition-colors duration-200 md:px-5 ${
                        t === term ? "bg-titanium text-asphalt" : "text-titanium/80 hover:bg-carbon-hi"
                      } border-r border-hairline-strong last:border-r-0`}
                    >
                      {t} mo
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:text-right">
                <div className="font-display text-[clamp(3.4rem,7vw,6.5rem)] leading-[0.85] tabular-nums">
                  <span ref={payment} aria-hidden>
                    {INITIAL_PAYMENT}
                  </span>
                  <span className="sr-only" aria-live="polite">
                    {usd.format(monthly(term))} per month over {term} months
                  </span>
                </div>
                <div className="tft mt-2 text-steel">Per month, {term} months</div>
              </div>
            </div>
            <p className="mt-8 border-t border-hairline pt-4 text-[0.6875rem] leading-relaxed text-steel">
              Representative example: {(APR * 100).toFixed(1)}% APR, {DEPOSIT * 100}% deposit of {usd.format(PRICE * DEPOSIT)}. Subject
              to status and approval.
            </p>
          </article>

          {/* Service desk */}
          <article className="bento-cell relative bg-asphalt p-6 md:col-span-4 md:p-8">
            <h3 className="display text-[clamp(1.8rem,2.6vw,2.6rem)]">Service desk</h3>
            <p className="tft mt-4 flex items-center gap-2 text-titanium">
              <span className={`inline-block h-2 w-2 ${status.open ? "bg-[#4af626]" : "bg-redline"}`} aria-hidden />
              {status.text}
            </p>
            <dl className="mt-6 divide-y divide-hairline border-y border-hairline">
              {HOURS.map((h) => (
                <div key={h.label} className="flex justify-between py-3 text-[0.8125rem]">
                  <dt className="text-titanium/70">{h.label}</dt>
                  <dd className="tabular-nums">
                    {h.open ? `${String(h.open[0]).padStart(2, "0")}:00 to ${h.open[1]}:00` : "Closed"}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </div>
    </section>
  );
}
