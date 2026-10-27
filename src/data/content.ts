/**
 * All copy, specs and asset references in one place. Every image lives in
 * public/assets/bikes/ (downloaded from Unsplash and verified HTTP 200 at fetch
 * time), so nothing on the page depends on a remote URL at runtime.
 */

export type CategoryId = "supersport" | "naked" | "adventure" | "cafe";
export type ServiceId = "test-ride" | "viewing" | "trade-in";

export const ASSETS = {
  hero: "/assets/bikes/hero-supersport.webp",
  anatomy: "/assets/bikes/anatomy-streetfighter.webp",
  pitRear: "/assets/bikes/pit-rear.webp",
  dyno: "/assets/bikes/svc-dyno.webp",
  track: "/assets/bikes/svc-track.webp",
  parts: "/assets/bikes/svc-parts.webp",
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

export const SERVICES: { id: ServiceId; name: string; detail: string }[] = [
  { id: "test-ride", name: "Test ride", detail: "45 minutes on our road loop, with a rider coach if you want one." },
  { id: "viewing", name: "Private showroom viewing", detail: "After hours, one-on-one, with the workshop open for questions." },
  { id: "trade-in", name: "Trade-in valuation", detail: "Bring your bike in. You leave with a written offer, valid for 14 days." },
];

export const TIME_SLOTS = ["Morning", "Afternoon", "Evening"] as const;

export const TESTIMONIALS = [
  {
    quote:
      "They set the bike up for my weight and my line into turn one, not for some brochure rider. I took two and a half seconds off my best lap.",
    rider: "Dana Whitlock",
    bike: "RR-999 Redline",
    delta: "-2.4 s",
    context: "Phillip Island, best lap",
  },
  {
    quote:
      "Collected the Meridian on a Friday with luggage on and the suspension set for two-up. Rode 1,900 km that week without touching a clicker.",
    rider: "Mateo Ruiz",
    bike: "ADV-1250 Meridian",
    delta: "1,900 km",
    context: "First week, no adjustments",
  },
  {
    quote:
      "The dyno sheet came with the bike. Eleven horsepower more after the map, and they showed me where every one of them came from.",
    rider: "Priya Nair",
    bike: "SF-1300 Brawler",
    delta: "+11 hp",
    context: "After custom map",
  },
];

export const CLASSIFICATION = [
  { season: 2025, series: "National Superbike", cls: "Superstock 1000", rider: "K. Ostrowski", result: "Champion" },
  { season: 2025, series: "Endurance Cup", cls: "Privateer", rider: "Team Apex 77", result: "P3" },
  { season: 2024, series: "National Superbike", cls: "Supersport", rider: "L. Brandt", result: "Champion" },
  { season: 2024, series: "Road Racing Series", cls: "Superbike", rider: "M. Calloway", result: "P2" },
  { season: 2023, series: "National Superbike", cls: "Superstock 1000", rider: "K. Ostrowski", result: "P2" },
  { season: 2022, series: "Endurance Cup", cls: "Privateer", rider: "Team Apex 77", result: "Champion" },
];

export const CIRCUITS = ["Mugello", "Phillip Island", "Laguna Seca", "Suzuka", "Assen", "Jerez", "Sachsenring", "Brno"];

export const CREDITS = [
  { use: "Hero supersport", author: "Rahul Lal", id: "Nv7hnFIm98k" },
  { use: "Anatomy flagship", author: "Lucas T", id: "nUZgRPB2VW4" },
  { use: "Supersport", author: "Vineet Naresh", id: "heJPDvxVURE" },
  { use: "Hyper-naked", author: "Klim Musalimov", id: "9xML5M-D72g" },
  { use: "Adventure", author: "Ilya Godze", id: "e7IaViDqYII" },
  { use: "Custom cafe", author: "Leon Seierlein", id: "VcBMbn7KXHQ" },
  { use: "Dyno lab", author: "Evgeniy Bezkorovayniy", id: "mHcr0PmibeE" },
  { use: "Track day", author: "Muyenda Burnett", id: "ryYnJ-XU53k" },
  { use: "Performance parts", author: "Ronnzy Moto", id: "2dO0evNNIOQ" },
  { use: "Pit stop", author: "Hemantha Varma", id: "MHyZoeF4N1g" },
];
