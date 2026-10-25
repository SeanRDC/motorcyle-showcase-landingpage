import { useRef } from "react";
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

function Experience() {
  const main = useRef<HTMLElement>(null);
  const scrollTo = useScrollTo();

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

  // TODO: preselect the bike in the booking form once it exists
  const inspect = (_category: CategoryId) => scrollTo("#pit-stop");

  return (
    <>
      <GridLines />
      <HudOverlay />
      <main ref={main} className="relative z-[1]">
        <HeroIgnition />
        <BikeDeconstruction />
        <HorizontalShowroom onInspect={inspect} />
        <ServicesBento />
      </main>
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
