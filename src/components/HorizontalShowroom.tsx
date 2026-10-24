import { useRef } from "react";
import { Crosshair as CrosshairIcon } from "lucide-react";
import { gsap, MOTION_CONDITIONS, ScrollTrigger, useGSAP, type MotionConditions } from "../lib/gsap";
import { countTo, formatNumber } from "../lib/format";
import { telemetry } from "../lib/telemetry";
import { BIKES, SPEC_SCALE, type CategoryId } from "../data/content";
import { MagneticButton } from "./ui/MagneticButton";

const SPEC_KEYS = ["displacement", "weight", "topSpeed"] as const;
const RAIL_MARKS = 36;

export function HorizontalShowroom({ onInspect }: { onInspect: (id: CategoryId) => void }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION_CONDITIONS, (ctx) => {
        const { motion } = ctx.conditions as MotionConditions;
        const pinEl = q(".showroom-pin")[0] as HTMLElement;
        const track = q(".track")[0] as HTMLElement;
        const cards = q(".bike-card") as HTMLElement[];

        if (!motion) {
          // Reduced motion: native horizontal scrolling, bars and values shown at rest.
          gsap.set(q(".spec-fill"), { scaleX: (_i: number, el: HTMLElement) => Number(el.dataset.pct) });
          q(".spec-val").forEach((el) => (el.textContent = formatNumber(Number((el as HTMLElement).dataset.to))));
          return;
        }

        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        // ease: "none" is required so containerAnimation triggers map 1:1 to scroll.
        const ride = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: pinEl,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        ride.to(track, { x: () => -distance() }, 0).to(q(".rail-strip"), { x: () => -distance() * 0.55 }, 0);

        cards.forEach((card) => {
          const fills = card.querySelectorAll<HTMLElement>(".spec-fill");
          const vals = card.querySelectorAll<HTMLElement>(".spec-val");

          const enter = gsap.timeline({
            scrollTrigger: {
              trigger: card,
              containerAnimation: ride,
              start: "left 78%",
              toggleActions: "play none none reverse",
            },
          });
          enter.fromTo(
            fills,
            { scaleX: 0 },
            { scaleX: (_i: number, el: HTMLElement) => Number(el.dataset.pct), duration: 1.1, ease: "expo.out", stagger: 0.12 },
            0,
          );
          vals.forEach((el, i) => enter.add(countTo(el, Number(el.dataset.to), { duration: 1.1 }), i * 0.12));

          // Photo drifts against the card as it crosses the viewport
          gsap.fromTo(
            card.querySelector(".card-img"),
            { xPercent: -7 },
            {
              xPercent: 0,
              ease: "none",
              scrollTrigger: { trigger: card, containerAnimation: ride, start: "left right", end: "right left", scrub: true },
            },
          );
        });

        // Velocity-reactive kinetic skew, only while the showroom is pinned
        const skewers = cards.map((card) => gsap.quickTo(card, "skewX", { duration: 0.55, ease: "power3" }));
        const tick = () => {
          const skew = gsap.utils.clamp(-9, 9, telemetry.velocity * 0.32);
          skewers.forEach((to) => to(skew));
        };
        ScrollTrigger.create({
          trigger: pinEl,
          start: "top bottom",
          end: () => `+=${distance() + window.innerHeight * 2}`,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            if (self.isActive) gsap.ticker.add(tick);
            else {
              gsap.ticker.remove(tick);
              skewers.forEach((to) => to(0));
            }
          },
        });

        return () => gsap.ticker.remove(tick);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="lineup" data-gear="3" aria-labelledby="lineup-title" className="relative">
      <div className="showroom-pin relative overflow-hidden motion-safe:h-svh">
        <div className="track flex h-full items-center gap-[5vw] motion-safe:w-max pl-gutter pr-[12vw] pt-[var(--hud-top)] pb-[calc(var(--hud-bottom)+56px)] will-change-transform motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:overflow-x-auto motion-reduce:py-[14vh]">
          {/* Intro panel */}
          <div className="flex w-[min(80vw,440px)] shrink-0 flex-col justify-center motion-reduce:snap-start">
            <h2 id="lineup-title" className="display text-[clamp(3.4rem,8vw,8.5rem)]">
              The
              <br />
              lineup
            </h2>
            <p className="mt-6 max-w-[38ch] text-[0.9375rem] leading-relaxed text-titanium/70">
              Four ways to ride, all on the floor this week. Every bike is prepped, plated and fuelled for a test
              ride.
            </p>
            <p className="tft mt-8 flex items-center gap-3 text-steel">
              <span className="inline-block h-px w-10 bg-redline" />
              Keep scrolling to ride the rail
            </p>
          </div>

          {BIKES.map((bike, idx) => (
            <article
              key={bike.id}
              aria-labelledby={`bike-${bike.id}`}
              className="bike-card relative grid h-[min(70svh,640px)] w-[min(86vw,1040px)] shrink-0 origin-bottom grid-rows-[40%_1fr] border border-hairline-strong bg-carbon will-change-transform md:grid-cols-[1.2fr_1fr] md:grid-rows-1 motion-reduce:snap-start"
            >
              {/* Photograph */}
              <div className="relative overflow-hidden border-b border-hairline-strong md:border-b-0 md:border-r">
                <img
                  src={bike.image}
                  alt={bike.alt}
                  loading="lazy"
                  decoding="async"
                  className="card-img absolute inset-y-0 left-0 h-full w-[108%] max-w-none object-cover"
                  style={{ objectPosition: bike.focus }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-asphalt/70 via-transparent to-asphalt/20" />
                {/* Viewfinder corners */}
                {["left-3 top-3 border-l border-t", "right-3 top-3 border-r border-t", "left-3 bottom-3 border-l border-b", "right-3 bottom-3 border-r border-b"].map(
                  (c) => (
                    <span key={c} aria-hidden className={`absolute h-5 w-5 border-titanium/60 ${c}`} />
                  ),
                )}
                <p className="tft absolute bottom-5 left-5 flex items-center gap-2 text-titanium/80">
                  <CrosshairIcon className="h-3.5 w-3.5 text-redline" strokeWidth={1.5} aria-hidden />
                  {bike.engine}
                </p>
              </div>

              {/* Spec sheet */}
              <div className="flex min-h-0 flex-col p-5 md:p-8">
                <h3 id={`bike-${bike.id}`} className="display text-[clamp(2.1rem,4.2vw,4.2rem)]">
                  {bike.category}
                </h3>
                <p className="mt-2 font-display text-lg uppercase tracking-[0.01em] text-redline md:text-xl">{bike.build}</p>
                <p className="mt-3 hidden max-w-[44ch] text-[0.8125rem] leading-relaxed text-titanium/70 sm:block md:mt-4">
                  {bike.blurb}
                </p>

                <dl className="mt-auto space-y-3 pt-4 md:space-y-4">
                  {SPEC_KEYS.map((key) => {
                    const scale = SPEC_SCALE[key];
                    const value = bike.specs[key];
                    return (
                      <div key={key}>
                        <div className="flex items-baseline justify-between">
                          <dt className="tft text-[0.5625rem] text-steel">{scale.label}</dt>
                          <dd className="font-display text-base tabular-nums md:text-lg">
                            <span className="spec-val" data-to={value}>
                              0
                            </span>{" "}
                            <span className="text-steel">{scale.unit}</span>
                          </dd>
                        </div>
                        <div className="mt-1.5 h-[3px] bg-hairline-strong" aria-hidden>
                          <div
                            className="spec-fill h-full origin-left scale-x-0 bg-titanium"
                            data-pct={(value / scale.max).toFixed(3)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </dl>

                <div className="mt-5 md:mt-7">
                  <MagneticButton
                    type="button"
                    onClick={() => onInspect(bike.id)}
                    className="tft chamfer border border-titanium/70 px-5 py-3.5 font-bold text-titanium transition-colors duration-200 hover:border-redline hover:bg-redline hover:text-asphalt"
                    aria-label={`Inspect the ${bike.build} and book a viewing`}
                  >
                    Inspect build
                  </MagneticButton>
                </div>
              </div>

              {/* Sector marker dropping to the rail */}
              <div aria-hidden className="absolute left-8 top-full flex h-10 flex-col items-start">
                <span className="h-full w-px bg-titanium/30" />
                <span className="tft -mt-px bg-titanium px-1.5 text-[0.5625rem] font-bold text-asphalt">S{idx + 1}</span>
              </div>
            </article>
          ))}

          {/* Exit panel */}
          <div className="flex w-[min(80vw,420px)] shrink-0 flex-col justify-center motion-reduce:snap-start">
            <p className="display text-[clamp(2.2rem,4.4vw,4.4rem)]">Can't choose? Ride two back to back.</p>
            <p className="mt-5 max-w-[36ch] text-[0.875rem] leading-relaxed text-titanium/70">
              Book a double slot and we'll have both bikes warm and waiting at the bay door.
            </p>
          </div>
        </div>

        {/* Track rail with distance markers (moves slower than the cards) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--hud-bottom)+14px)] h-10 overflow-hidden motion-reduce:hidden"
        >
          <div className="absolute left-0 right-0 top-1/2 h-px bg-titanium/25" />
          <div
            className="rail-strip absolute left-0 top-0 h-full w-[420vw]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgb(226 228 233 / 0.35) 0 1px, transparent 1px 28px)",
              backgroundSize: "100% 8px",
              backgroundPosition: "0 50%",
              backgroundRepeat: "repeat-x",
            }}
          >
            {Array.from({ length: RAIL_MARKS }, (_, i) => (
              <span
                key={i}
                className="tft absolute top-0 -translate-x-1/2 text-[0.5rem] text-steel"
                style={{ left: `${(i / RAIL_MARKS) * 100}%` }}
              >
                {(i * 0.2).toFixed(1)} km
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
