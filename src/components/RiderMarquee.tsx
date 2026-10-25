import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import { telemetry } from "../lib/telemetry";
import { CIRCUITS, CLASSIFICATION, TESTIMONIALS } from "../data/content";

const STATS = ["1,480 bikes delivered", "9 titles supported", "312 dyno runs a year", "41 track days in 2025"];

function MarqueeRow({ items, outline = false }: { items: string[]; outline?: boolean }) {
  return (
    <div className="overflow-hidden border-y border-hairline py-3 md:py-5">
      <div className="marquee-track flex w-max will-change-transform">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 items-center">
            {items.map((item) => (
              <li key={item} className="flex items-center">
                <span
                  className={`display whitespace-nowrap px-[0.18em] text-[clamp(3.6rem,10vw,11rem)] ${
                    outline ? "text-outline" : "text-titanium"
                  }`}
                >
                  {item}
                </span>
                <span aria-hidden className="mx-[2vw] block h-[0.9em] w-[3px] skew-x-[-18deg] bg-redline text-[clamp(3.6rem,10vw,11rem)]" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export function RiderMarquee() {
  const root = useRef<HTMLElement>(null);
  const playing = useRef(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const rows = q(".marquee-track") as HTMLElement[];
      const setters = rows.map((row) => gsap.quickSetter(row, "xPercent"));
      const wrap = gsap.utils.wrap(-50, 0);
      const pos = rows.map(() => -25);
      setters.forEach((set, i) => set(pos[i]));

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        playing.current = false;
        setIsPlaying(false);
      }

      // Base drift plus a velocity boost; scroll direction flips both rows.
      const tick = (_time: number, deltaMs: number) => {
        if (!playing.current) return;
        const frames = Math.min(deltaMs / 16.667, 4);
        const boost = Math.min(Math.abs(telemetry.velocity) * 0.011, 0.42);
        rows.forEach((_, i) => {
          const lane = i === 0 ? -1 : 1;
          pos[i] = wrap(pos[i] + lane * telemetry.direction * (0.04 + boost) * frames);
          setters[i](pos[i]);
        });
      };

      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
      });

      // Classification rows post like a timing tower updating
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.from(q(".class-row"), {
          autoAlpha: 0,
          x: -14,
          duration: 0.35,
          stagger: 0.09,
          ease: "steps(4)",
          scrollTrigger: { trigger: q(".class-table")[0], start: "top 80%", once: true },
        });
      }

      return () => gsap.ticker.remove(tick);
    },
    { scope: root },
  );

  const toggle = () => {
    playing.current = !playing.current;
    setIsPlaying(playing.current);
  };

  const [featured, ...rest] = TESTIMONIALS;

  return (
    <section ref={root} id="proof" data-gear="5" aria-labelledby="proof-title" className="relative py-[16vh]">
      <div className="flex flex-wrap items-end justify-between gap-6 px-gutter">
        <h2 id="proof-title" className="display text-[clamp(3rem,8.5vw,9rem)]">
          The rider's
          <br />
          proof
        </h2>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!isPlaying}
          className="tft flex items-center gap-2 border border-hairline-strong px-3 py-2 text-titanium/80 transition-colors duration-200 hover:border-titanium hover:text-titanium"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
          {isPlaying ? "Pause marquee" : "Play marquee"}
        </button>
      </div>

      <div className="mt-12 md:mt-16">
        <MarqueeRow items={CIRCUITS} />
      </div>

      {/* Testimonials: one featured, two supporting */}
      <div className="grid gap-px bg-hairline md:grid-cols-12">
        <figure className="bg-asphalt px-gutter py-10 md:col-span-7 md:py-16 md:pr-12">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-[clamp(3rem,6vw,5.6rem)] leading-none text-redline">{featured.delta}</span>
            <span className="tft text-steel">{featured.context}</span>
          </div>
          <blockquote className="display mt-6 max-w-[22ch] text-[clamp(1.6rem,2.9vw,2.9rem)] leading-[1.02] tracking-[-0.005em]">
            {featured.quote}
          </blockquote>
          <figcaption className="tft mt-8 text-titanium/80">
            {featured.rider}
            <span className="ml-3 text-steel">{featured.bike} owner</span>
          </figcaption>
        </figure>
        <div className="grid gap-px md:col-span-5">
          {rest.map((t) => (
            <figure key={t.rider} className="bg-asphalt px-gutter py-10 md:py-12 md:pl-10">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[2.4rem] leading-none text-titanium">{t.delta}</span>
                <span className="tft text-steel">{t.context}</span>
              </div>
              <blockquote className="mt-4 max-w-[48ch] text-[0.875rem] leading-relaxed text-titanium/80">{t.quote}</blockquote>
              <figcaption className="tft mt-5 text-titanium/80">
                {t.rider}
                <span className="ml-3 text-steel">{t.bike} owner</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <MarqueeRow items={STATS} outline />

      {/* Pedigree as a race classification */}
      <div className="mt-20 px-gutter md:mt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="display text-[clamp(2.2rem,4.4vw,4.4rem)]">Race pedigree</h3>
          <p className="max-w-[44ch] text-[0.8125rem] leading-relaxed text-titanium/70">
            Bikes prepared in our workshop for riders and privateer teams. Same benches, same torque wrenches as your
            road bike.
          </p>
        </div>
        <div className="mt-8 overflow-x-auto" data-lenis-prevent>
          <table className="class-table w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="tft border-y border-hairline-strong text-[0.5625rem] text-steel">
                <th scope="col" className="py-3 pr-4 font-normal">Season</th>
                <th scope="col" className="py-3 pr-4 font-normal">Series</th>
                <th scope="col" className="py-3 pr-4 font-normal">Class</th>
                <th scope="col" className="py-3 pr-4 font-normal">Rider / team</th>
                <th scope="col" className="py-3 text-right font-normal">Result</th>
              </tr>
            </thead>
            <tbody>
              {CLASSIFICATION.map((row) => (
                <tr key={`${row.season}-${row.series}-${row.cls}`} className="class-row border-b border-hairline text-[0.875rem]">
                  <td className="py-4 pr-4 font-display text-xl tabular-nums">{row.season}</td>
                  <td className="py-4 pr-4 text-titanium/85">{row.series}</td>
                  <td className="py-4 pr-4 text-titanium/60">{row.cls}</td>
                  <td className="py-4 pr-4">{row.rider}</td>
                  <td className="py-4 text-right">
                    <span
                      className={`tft inline-block px-2 py-1 ${
                        row.result === "Champion" ? "bg-redline font-bold text-asphalt" : "border border-hairline-strong text-titanium"
                      }`}
                    >
                      {row.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
