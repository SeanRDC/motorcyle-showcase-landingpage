import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./lib/gsap";
import { setGear, telemetry, type GearId } from "./lib/telemetry";
import { SmoothScroll } from "./providers/SmoothScroll";
import { Grain, GridLines } from "./components/ui/Atmosphere";
import { HudOverlay } from "./components/HudOverlay";
import { HeroIgnition } from "./components/HeroIgnition";
import { BikeDeconstruction } from "./components/BikeDeconstruction";

function Experience() {
  const main = useRef<HTMLElement>(null);

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

  return (
    <>
      <GridLines />
      <HudOverlay />
      <main ref={main} className="relative z-[1]">
        <HeroIgnition />
        <BikeDeconstruction />
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
