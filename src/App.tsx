import { Grain, GridLines } from "./components/ui/Atmosphere";

export default function App() {
  return (
    <>
      <GridLines />
      <main className="relative z-[1] grid min-h-svh place-items-center">
        <h1 className="display text-[12vw]">Apex Moto</h1>
      </main>
      <Grain />
    </>
  );
}
