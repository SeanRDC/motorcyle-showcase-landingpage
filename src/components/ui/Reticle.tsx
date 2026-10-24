/** Targeting reticle: inner ring, dashed outer ring (class reticle-ring for spin), crosshair ticks, corner brackets. */
export function Reticle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden className={className}>
      <g strokeWidth="1" vectorEffect="non-scaling-stroke">
        <circle cx="50" cy="50" r="22" opacity="0.9" vectorEffect="non-scaling-stroke" />
        <circle
          className="reticle-ring origin-center"
          cx="50"
          cy="50"
          r="34"
          strokeDasharray="3 5"
          opacity="0.55"
          vectorEffect="non-scaling-stroke"
        />
        <path d="M50 4v16M50 80v16M4 50h16M80 50h16" vectorEffect="non-scaling-stroke" />
        <path d="M22 10H10v12M78 10h12v12M22 90H10V78M78 90h12V78" opacity="0.7" vectorEffect="non-scaling-stroke" />
      </g>
      <circle cx="50" cy="50" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A "+" registration mark sitting on a grid intersection. */
export function Crosshair({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 11 11" aria-hidden className={`h-[11px] w-[11px] text-titanium/40 ${className}`}>
      <path d="M5.5 0v11M0 5.5h11" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
