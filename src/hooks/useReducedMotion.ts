import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const read = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(QUERY).matches
    : false;

/** Tracks the OS reduced-motion preference, including live toggles. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(read);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
