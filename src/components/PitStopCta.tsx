import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { gsap, useGSAP } from "../lib/gsap";
import { ASSETS, BIKES, SERVICES, TIME_SLOTS, type CategoryId, type ServiceId } from "../data/content";
import { MagneticButton } from "./ui/MagneticButton";

export type BookingPreset = { category: CategoryId; service: ServiceId; nonce: number };
type TimeSlot = (typeof TIME_SLOTS)[number];
type FieldKey = "name" | "contact" | "date";
type Errors = Partial<Record<FieldKey, string>>;

const pad = (n: number) => String(n).padStart(2, "0");
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toISODate(d);
};
const parseLocal = (iso: string) => new Date(`${iso}T00:00:00`);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isContact = (v: string) => EMAIL.test(v.trim()) || v.replace(/\D/g, "").length >= 7;

function validate(name: string, contact: string, date: string, slot: TimeSlot): Errors {
  const errors: Errors = {};
  if (name.trim().length < 2) errors.name = "Enter your name so we know who to expect.";
  if (!isContact(contact)) errors.contact = "Enter an email or a phone number so we can confirm your slot.";
  if (!date) {
    errors.date = "Pick a date for your visit.";
  } else if (date < tomorrowISO()) {
    errors.date = "Pick a date from tomorrow onward.";
  } else {
    const day = parseLocal(date).getDay();
    if (day === 0 || day === 1) errors.date = "We're closed Sundays and Mondays. Pick Tuesday to Saturday.";
    else if (day === 6 && slot === "Evening") errors.date = "Saturday slots end at 16:00. Pick morning or afternoon.";
  }
  return errors;
}

const maskContact = (v: string) => {
  const t = v.trim();
  if (EMAIL.test(t)) {
    const [user, domain] = t.split("@");
    return `${user[0]}${"*".repeat(Math.max(2, user.length - 1))}@${domain}`;
  }
  const digits = t.replace(/\D/g, "");
  return `${"*".repeat(Math.max(0, digits.length - 3))}${digits.slice(-3)}`;
};

function Field({
  label,
  error,
  children,
  id,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id} className="tft flex items-center gap-2 text-[0.625rem] text-steel">
        <span className="field-prompt transition-colors duration-200">&gt;</span>
        {label}
      </label>
      <div className="relative mt-2 border-b border-hairline-strong">
        {children}
        <span className="field-rule" aria-hidden />
      </div>
      <p id={`${id}-error`} className="mt-2 min-h-[1.1em] text-[0.75rem] text-redline" aria-live="polite">
        {error ?? ""}
      </p>
    </div>
  );
}

const inputClass =
  "w-full bg-transparent py-2.5 font-mono text-[0.9375rem] text-titanium placeholder:text-steel/60 outline-none [color-scheme:dark]";

export function PitStopCta({ preset }: { preset: BookingPreset | null }) {
  const root = useRef<HTMLElement>(null);
  const uid = useId();
  const [category, setCategory] = useState<CategoryId>("supersport");
  const [service, setService] = useState<ServiceId>("test-ride");
  const [slot, setSlot] = useState<TimeSlot>("Morning");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<"form" | "sending" | "confirmed">("form");
  const [reference, setReference] = useState("");
  const [loaded, setLoaded] = useState<string | null>(null);

  // "Inspect build" in the showroom hands a category and service over to this form.
  useEffect(() => {
    if (!preset) return;
    const bike = BIKES.find((b) => b.id === preset.category);
    setCategory(preset.category);
    setService(preset.service);
    setPhase("form");
    setLoaded(bike ? `${bike.build} loaded. Pick a date and we'll have it on the stand.` : null);
  }, [preset]);

  const bike = BIKES.find((b) => b.id === category)!;
  const serviceInfo = SERVICES.find((s) => s.id === service)!;

  // Start lights: one per completed part of the booking.
  const lights = [
    true,
    true,
    name.trim().length >= 2,
    isContact(contact),
    !!date && !validate(name, contact, date, slot).date,
  ];
  const lit = phase === "form" ? lights.filter(Boolean).length : phase === "sending" ? 5 : 0;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate(name, contact, date, slot);
    setErrors(next);
    const firstInvalid = (Object.keys(next) as FieldKey[])[0];
    if (firstInvalid) {
      document.getElementById(`${uid}-${firstInvalid}`)?.focus();
      return;
    }
    setPhase("sending");
    window.setTimeout(() => {
      setReference(`APX-${Math.floor(1000 + Math.random() * 9000)}`);
      setPhase("confirmed");
    }, 1200);
  };

  const reset = () => {
    setName("");
    setContact("");
    setDate("");
    setErrors({});
    setLoaded(null);
    setPhase("form");
  };

  // Transmission bar and the confirmation printout
  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const q = gsap.utils.selector(root);
      if (phase === "sending") {
        gsap.fromTo(q(".tx-bar"), { scaleX: 0 }, { scaleX: 1, duration: reduce ? 0 : 1.15, ease: "power1.inOut" });
      }
      if (phase === "confirmed") {
        gsap.from(q(".confirm-line"), {
          autoAlpha: 0,
          x: reduce ? 0 : -10,
          duration: reduce ? 0.15 : 0.3,
          stagger: reduce ? 0 : 0.11,
          ease: reduce ? "none" : "steps(3)",
        });
        q(".confirm-heading")[0]?.focus();
      }
    },
    { scope: root, dependencies: [phase], revertOnUpdate: true },
  );

  const fieldProps = (key: FieldKey) => ({
    id: `${uid}-${key}`,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": `${uid}-${key}-error`,
    onBlur: () => {
      if (!errors[key]) return;
      setErrors((prev) => ({ ...prev, [key]: validate(name, contact, date, slot)[key] }));
    },
  });

  return (
    <section ref={root} id="pit-stop" data-gear="6" aria-labelledby="pit-title" className="relative grid md:min-h-svh md:grid-cols-2">
      {/* Rear three-quarter, ready to launch */}
      <div className="relative min-h-[70svh] overflow-hidden border-hairline md:min-h-0 md:border-r">
        <img
          src={ASSETS.pitRear}
          alt="Red sport motorcycle seen from behind at night, LED taillight glowing"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[50%_45%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-asphalt via-asphalt/25 to-asphalt/60" />
        <span
          aria-hidden
          className="absolute h-[16%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen [animation:tail-pulse_2.6s_ease-in-out_infinite]"
          style={{
            left: "49%",
            top: "42%",
            background: "radial-gradient(closest-side, rgb(255 42 0 / 0.55), rgb(255 42 0 / 0.12) 60%, transparent)",
          }}
        />

        {/* Start lights: progress of the booking */}
        <div className="absolute inset-x-0 bottom-0 p-gutter pb-[calc(var(--hud-bottom)+28px)] md:pb-[calc(var(--hud-bottom)+40px)]">
          <div className="flex gap-2.5" role="img" aria-label={`${lit} of 5 booking steps ready`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-5 w-5 rounded-full border transition-[background-color,box-shadow,border-color] duration-300 md:h-6 md:w-6 ${
                  i < lit
                    ? "border-redline bg-redline shadow-[0_0_18px_4px_rgb(255_42_0_/_0.55)]"
                    : "border-titanium/30 bg-asphalt/60"
                }`}
              />
            ))}
          </div>
          <p className="tft mt-4 text-titanium/80">
            {phase === "confirmed" ? "Lights out. You're booked." : lit === 5 ? "All lights on. Ready to launch." : `${lit} of 5 ready`}
          </p>
        </div>
      </div>

      {/* Terminal booking console */}
      <div className="relative bg-carbon/60 px-gutter pb-[calc(var(--hud-bottom)+48px)] pt-16 md:pt-[calc(var(--hud-top)+56px)]">
        <h2 id="pit-title" className="display text-[clamp(3rem,6.4vw,6.8rem)]">
          The pit stop
        </h2>
        <p className="mt-4 max-w-[44ch] text-[0.875rem] leading-relaxed text-titanium/70">
          Pick a bike and a service. We'll confirm by phone or email within two working hours.
        </p>

        {phase !== "confirmed" ? (
          <form noValidate onSubmit={onSubmit} className="mt-10 space-y-8" aria-describedby={loaded ? `${uid}-loaded` : undefined}>
            {loaded && (
              <p id={`${uid}-loaded`} className="tft flex items-center gap-2 border-l-2 border-redline bg-redline/10 px-3 py-2 text-titanium" role="status">
                <Check className="h-3.5 w-3.5 text-redline" aria-hidden />
                {loaded}
              </p>
            )}

            <fieldset>
              <legend className="tft text-[0.625rem] text-steel">&gt; Ride category</legend>
              <div className="mt-3 grid grid-cols-2 gap-px border border-hairline-strong bg-hairline-strong sm:grid-cols-4">
                {BIKES.map((b) => (
                  <label key={b.id} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={b.id}
                      checked={category === b.id}
                      onChange={() => setCategory(b.id)}
                      className="peer sr-only"
                    />
                    <span className="tft block bg-carbon px-3 py-3.5 text-center text-titanium/75 transition-colors duration-200 hover:bg-carbon-hi peer-checked:bg-titanium peer-checked:font-bold peer-checked:text-asphalt peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[-2px] peer-focus-visible:outline-redline">
                      {b.category}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="tft text-[0.625rem] text-steel">&gt; Service</legend>
              <div className="mt-3 grid gap-px border border-hairline-strong bg-hairline-strong">
                {SERVICES.map((s) => (
                  <label key={s.id} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="service"
                      value={s.id}
                      checked={service === s.id}
                      onChange={() => setService(s.id)}
                      className="peer sr-only"
                    />
                    <span className="group flex items-start gap-4 bg-carbon px-4 py-3.5 transition-colors duration-200 hover:bg-carbon-hi peer-checked:bg-carbon-hi peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[-2px] peer-focus-visible:outline-redline">
                      <span
                        aria-hidden
                        className={`mt-1 grid h-3.5 w-3.5 shrink-0 place-items-center border ${
                          service === s.id ? "border-redline" : "border-titanium/40"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 ${service === s.id ? "bg-redline" : "bg-transparent"}`} />
                      </span>
                      <span>
                        <span className="block font-display text-lg uppercase leading-tight">{s.name}</span>
                        <span className="mt-1 block text-[0.75rem] leading-relaxed text-titanium/60">{s.detail}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Your name" error={errors.name} id={`${uid}-name`}>
                <input
                  {...fieldProps("name")}
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dana Whitlock"
                  className={inputClass}
                />
              </Field>
              <Field label="Email or phone" error={errors.contact} id={`${uid}-contact`}>
                <input
                  {...fieldProps("contact")}
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="dana@example.com"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Preferred date" error={errors.date} id={`${uid}-date`}>
                <input
                  {...fieldProps("date")}
                  type="date"
                  min={tomorrowISO()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <fieldset>
                <legend className="tft text-[0.625rem] text-steel">&gt; Time</legend>
                <div className="mt-2 grid grid-cols-3 border border-hairline-strong">
                  {TIME_SLOTS.map((t) => (
                    <label key={t} className="relative cursor-pointer border-r border-hairline-strong last:border-r-0">
                      <input
                        type="radio"
                        name="slot"
                        value={t}
                        checked={slot === t}
                        onChange={() => setSlot(t)}
                        className="peer sr-only"
                      />
                      <span className="tft block px-2 py-3 text-center text-[0.625rem] text-titanium/75 transition-colors duration-200 hover:bg-carbon-hi peer-checked:bg-titanium peer-checked:font-bold peer-checked:text-asphalt peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[-2px] peer-focus-visible:outline-redline">
                        {t}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="flex flex-wrap items-center gap-6 border-t border-hairline pt-8">
              <MagneticButton
                type="submit"
                disabled={phase === "sending"}
                className="chamfer bg-redline px-8 py-5 font-display text-[1.35rem] uppercase leading-none text-asphalt transition-colors duration-200 hover:bg-titanium disabled:cursor-wait disabled:bg-steel md:text-[1.6rem]"
              >
                {phase === "sending" ? "Transmitting" : "Book your launch"}
              </MagneticButton>
              <p className="tft text-[0.5625rem] leading-relaxed text-steel">
                {bike.build}
                <br />
                {serviceInfo.name}, {slot.toLowerCase()}
              </p>
            </div>
            {phase === "sending" && (
              <div className="h-[2px] bg-hairline-strong" aria-hidden>
                <div className="tx-bar h-full origin-left bg-redline" />
              </div>
            )}
          </form>
        ) : (
          <div className="mt-10 border border-hairline-strong bg-asphalt/70 p-6 md:p-8">
            <h3 tabIndex={-1} className="confirm-heading confirm-line display text-[clamp(2rem,3.4vw,3.2rem)] text-redline outline-none">
              Booking received
            </h3>
            <dl className="mt-6 space-y-2 text-[0.8125rem]">
              {[
                ["Reference", reference],
                ["Bike", `${bike.build} (${bike.category})`],
                ["Service", serviceInfo.name],
                [
                  "Date",
                  `${parseLocal(date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}, ${slot.toLowerCase()}`,
                ],
                ["Rider", name.trim()],
                ["Contact", maskContact(contact)],
              ].map(([k, v]) => (
                <div key={k} className="confirm-line flex items-baseline gap-3">
                  <dt className="tft shrink-0 text-steel">&gt; {k}</dt>
                  <span className="min-w-6 flex-1 translate-y-[-3px] border-b border-dotted border-titanium/20" aria-hidden />
                  <dd className="text-right text-titanium">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="confirm-line mt-6 max-w-[52ch] text-[0.8125rem] leading-relaxed text-titanium/70">
              We'll call or email to confirm the slot within two working hours. Bring your licence and riding gear; we
              keep helmets in every size if you need one.
              <span className="caret ml-1 text-redline" aria-hidden />
            </p>
            <button
              type="button"
              onClick={reset}
              className="confirm-line tft mt-8 border border-titanium/60 px-5 py-3 text-titanium transition-colors duration-200 hover:border-redline hover:text-redline"
            >
              Book another visit
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
