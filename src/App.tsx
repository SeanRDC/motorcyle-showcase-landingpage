import { SmoothScroll } from "./providers/SmoothScroll";
import { Grain, GridLines } from "./components/ui/Atmosphere";

export default function App() {
  return (
    <SmoothScroll>
      <GridLines />
      <main className="relative z-[1]">
        <section className="grid h-svh place-items-center">
          <h1 className="display text-[12vw]">Apex Moto</h1>
        </section>
        <section className="h-[200vh]" />
      </main>
      <Grain />
    </SmoothScroll>
  );
}
