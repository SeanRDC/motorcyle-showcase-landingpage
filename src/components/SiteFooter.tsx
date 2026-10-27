import { CREDITS } from "../data/content";

export function SiteFooter() {
  return (
    <footer className="relative z-[1] border-t border-hairline bg-asphalt px-gutter pb-[calc(var(--hud-bottom)+40px)] pt-16">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="display text-[clamp(3rem,7vw,7rem)]">Apex Moto</p>
          <address className="mt-6 not-italic text-[0.8125rem] leading-relaxed text-titanium/70">
            Bay 7, 41 Foundry Road
            <br />
            Workshop and showroom, Tuesday to Saturday
          </address>
        </div>
        <div className="md:col-span-7">
          <p className="tft text-steel">Photography, via Unsplash</p>
          <ul className="mt-4 grid gap-x-6 gap-y-2 text-[0.75rem] text-titanium/65 sm:grid-cols-2">
            {CREDITS.map((c) => (
              <li key={c.id} className="flex justify-between gap-4 border-b border-hairline pb-2">
                <span className="text-steel">{c.use}</span>
                <a
                  href={`https://unsplash.com/photos/${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-titanium/80 underline decoration-titanium/25 underline-offset-4 transition-colors hover:text-redline hover:decoration-redline"
                >
                  {c.author}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="tft mt-14 text-[0.5625rem] text-steel">© {new Date().getFullYear()} Apex Moto. Specifications are for the dealership's own builds.</p>
    </footer>
  );
}
