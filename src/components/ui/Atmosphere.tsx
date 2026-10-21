/** Fixed architectural column hairlines (6 columns desktop, 2 on phones). */
export function GridLines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 left-[var(--gutter)] right-[var(--gutter)] z-0 grid grid-cols-2 border-r border-hairline md:grid-cols-6"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={`border-l border-hairline ${i >= 2 ? "hidden md:block" : ""}`} />
      ))}
    </div>
  );
}

/** Same column rhythm, drawn inside an opaque section so blend modes can see it. */
export function LocalGridLines({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 left-[var(--gutter)] right-[var(--gutter)] grid grid-cols-2 border-r border-hairline md:grid-cols-6 ${className}`}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={`border-l border-hairline ${i >= 2 ? "hidden md:block" : ""}`} />
      ))}
    </div>
  );
}

export function Grain() {
  return <div aria-hidden className="grain" />;
}
