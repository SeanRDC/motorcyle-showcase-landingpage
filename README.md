# APEX MOTO

Scroll-driven landing page for a performance motorcycle dealership. Vite + React + TypeScript, Tailwind CSS v4, GSAP (ScrollTrigger, `@gsap/react`) and Lenis.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
```

## Structure

```
src/
  lib/gsap.ts            plugin registration, shared matchMedia conditions
  lib/telemetry.ts       per-frame telemetry bus (velocity, km/h, lean, rpm, gear)
  providers/SmoothScroll Lenis driven by gsap.ticker, synced to ScrollTrigger
  components/
    HudOverlay           fixed TFT frame: tach + redline, gear indicator, km/h, lean, gear nav
    HeroIgnition         Gear 1, pinned 150vh: boot log, rpm sweep, LED flare, kinetic split
    BikeDeconstruction   Gear 2, pinned 250vh: powertrain / aero / electronics callouts
    HorizontalShowroom   Gear 3, horizontal track with velocity skew and spec bars
    ServicesBento        Gear 4, clip-mask reveals, image parallax, dyno chart, finance terms
    RiderMarquee         Gear 5, velocity-reactive marquees, testimonials, race classification
    PitStopCta           Gear 6, booking console with validation and confirmation
  data/content.ts        all copy, specs, asset paths and photo credits
```

Every section has a `prefers-reduced-motion` path: Lenis is not created, pins are dropped, the showroom becomes a native horizontal scroller and the marquee starts paused.

The booking form validates and confirms on the client only. Wire `onSubmit` in `PitStopCta.tsx` to a real endpoint before going live.

## Deployment

Pushing to `main` builds the site and deploys it to GitHub Pages through `.github/workflows/deploy.yml`. The repository's Pages source must be set to GitHub Actions. The Vite `base` is relative, so reference files in `public/` through `import.meta.env.BASE_URL` rather than a leading `/`.

## Photography

All images are stored locally in `public/assets/bikes/` and come from Unsplash under the [Unsplash License](https://unsplash.com/license). Photographers are credited in the footer and listed in `src/data/content.ts`. The licence plate in `pit-rear.webp` has been blurred.
