/**
 * All copy, specs and asset references in one place. Every image lives in
 * public/assets/bikes/ (downloaded from Unsplash and verified HTTP 200 at fetch
 * time), so nothing on the page depends on a remote URL at runtime.
 */

export type CategoryId = "supersport" | "naked" | "adventure" | "cafe";

export const ASSETS = {
  hero: "/assets/bikes/hero-supersport.webp",
  anatomy: "/assets/bikes/anatomy-streetfighter.webp",
} as const;

export type Bike = {
  id: CategoryId;
  category: string;
  build: string;
  image: string;
  alt: string;
  /** object-position for the card crop */
  focus: string;
  blurb: string;
  engine: string;
  specs: { displacement: number; weight: number; topSpeed: number };
};

export const SPEC_SCALE = {
  displacement: { max: 1400, unit: "cc", label: "Displacement" },
  weight: { max: 260, unit: "kg", label: "Wet weight" },
  topSpeed: { max: 320, unit: "km/h", label: "Top speed" },
} as const;

export const BIKES: Bike[] = [
  {
    id: "supersport",
    category: "Supersport",
    build: "RR-999 Redline",
    image: "/assets/bikes/card-supersport.webp",
    alt: "Red supersport motorcycle lit by vertical strip lights",
    focus: "50% 58%",
    blurb:
      "Track-bred and road-legal. We set sag, gearing and the quickshifter to your weight before it leaves the floor.",
    engine: "Inline-4, 999 cc",
    specs: { displacement: 999, weight: 197, topSpeed: 299 },
  },
  {
    id: "naked",
    category: "Hyper-naked",
    build: "SF-1300 Brawler",
    image: "/assets/bikes/card-naked.webp",
    alt: "Orange naked streetfighter parked on a monochrome city street",
    focus: "50% 44%",
    blurb:
      "A superbike engine with the fairing taken off and wide bars bolted on. All of the torque, none of the tuck.",
    engine: "V-twin, 1,301 cc",
    specs: { displacement: 1301, weight: 200, topSpeed: 290 },
  },
  {
    id: "adventure",
    category: "Adventure touring",
    build: "ADV-1250 Meridian",
    image: "/assets/bikes/card-adventure.webp",
    alt: "Silver adventure motorcycle with aluminium panniers on rocky ground",
    focus: "50% 62%",
    blurb:
      "Long-travel suspension, a 30-litre tank and luggage fitted. Ready for the paved road and for the one after it ends.",
    engine: "Boxer twin, 1,254 cc",
    specs: { displacement: 1254, weight: 249, topSpeed: 225 },
  },
  {
    id: "cafe",
    category: "Custom cafe",
    build: "CR-900 Atelier",
    image: "/assets/bikes/card-cafe.webp",
    alt: "Black and white cafe racer under a single fluorescent tube in a concrete garage",
    focus: "50% 66%",
    blurb:
      "Clip-ons, rear-sets and a hand-stitched bench, built to order in our workshop on a modern parallel twin.",
    engine: "Parallel twin, 900 cc",
    specs: { displacement: 900, weight: 206, topSpeed: 200 },
  },
];
