/**
 * All copy, specs and asset references in one place. Every image lives in
 * public/assets/bikes/ (downloaded from Unsplash and verified HTTP 200 at fetch
 * time), so nothing on the page depends on a remote URL at runtime.
 */

export const ASSETS = {
  hero: "/assets/bikes/hero-supersport.webp",
  anatomy: "/assets/bikes/anatomy-streetfighter.webp",
} as const;
