import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./lib/gsap";
import { setGear, telemetry, type GearId } from "./lib/telemetry";
import { SmoothScroll, useScrollTo } from "./providers/SmoothScroll";
import type { CategoryId } from "./data/content";
import { Grain, GridLines } from "./components/ui/Atmosphere";
import { HudOverlay } from "./components/HudOverlay";
import { HeroIgnition } from "./components/HeroIgnition";
import { BikeDeconstruction } from "./components/BikeDeconstruction";
import { HorizontalShowroom } from "./components/HorizontalShowroom";
import { ServicesBento } from "./components/ServicesBento";
import { RiderMarquee } from "./components/RiderMarquee";
import { PitStopCta, type BookingPreset } from "./components/PitStopCta";
import { SiteFooter } from "./components/SiteFooter";

function Experience() {
  const main = useRef<HTMLElement>(null);
  const scrollTo = useScrollTo();
  const [preset, setPreset] = useState<BookingPreset | null>(null);

  // Parent layout effects run after every child section has built its pins, so
  // these gear triggers are created last and measure the final pin spacing.
  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-gear]", main.current).forEach((section) => {
        const gear = Number(section.dataset.gear) as GearId;
        ScrollTrigger.create({
          trigger: section,
          start: gear === 1 ? "top+=40 top" : "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (self.isActive) setGear(gear);
          },
          onUpdate: (self) => {
            if (telemetry.gear === gear) telemetry.gearProgress = self.progress;
          },
          onLeaveBack: gear === 1 ? () => setGear(0) : undefined,
        });
      });

      // Display-font metrics change line heights; re-measure once they land.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: main },
  );

  const inspect = (category: CategoryId) => {
    setPreset({ category, service: "viewing", nonce: Date.now() });
    scrollTo("#pit-stop");
  };

  return (
    <>
      <a
        href="#pit-stop"
        className="tft fixed left-3 top-3 z-[80] -translate-y-24 bg-redline px-4 py-3 font-bold text-asphalt focus:translate-y-0"
      >
        Skip to booking
      </a>
      <GridLines />
      <HudOverlay />
      <main ref={main} className="relative z-[1]">
        <HeroIgnition />
        <BikeDeconstruction />
        <HorizontalShowroom onInspect={inspect} />
        <ServicesBento />
        <RiderMarquee />
        <PitStopCta preset={preset} />
      </main>
      <SiteFooter />
      <Grain />
    </>
  );
}

export default function App() {
  return (
    <SmoothScroll>
      <Experience />
    </SmoothScroll>
  );
}
