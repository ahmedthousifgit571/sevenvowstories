'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { useShortlist } from '@/lib/shortlist';
import { curtainClick, LABELS } from '@/lib/curtain';
import { collections, events, site } from '@/content/site';
import { shortCity, weddingBySlug, type Wedding } from '@/content/collection';
import { buildEnquiry, emailHref, emptyEnquiry, prettyDate, validateStep, whatsappHref, type Enquiry } from './enquiry';
import DateField from './DateField';

// The five steps carry roman numerals, like the seven vows they lead to.
const STEPS = [
  { title: 'The two of you', note: 'Your names, and the date if you already have one.' },
  { title: 'Where & how many', note: 'Where the celebrations will be, and roughly how many guests.' },
  { title: 'The celebrations', note: 'Choose every celebration you would like us there for.' },
  { title: 'What to capture', note: 'Film, photographs or both. A package is optional.' },
  { title: 'How to reach you', note: 'WhatsApp or email, whichever you prefer.' },
];
const NUMERALS = ['I', 'II', 'III', 'IV', 'V'];
const GUESTS = ['Under 100', '100 – 250', '250 – 500', '500+'];
const COVERAGE = [
  { value: 'Film', note: 'A short film, cut like a story' },
  { value: 'Photography', note: 'Editorial photographs and a book' },
  { value: 'Film + photography', note: 'The complete chapter' },
] as const;
const DRAFT_KEY = 'svs-enquiry-draft';
const ACCENT = '#e7a04a';
const NIGHT = '#1d1a1f';

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="group">
      <label htmlFor={id} className="eyebrow block text-[0.6rem] text-paper/50 transition-colors duration-300 group-focus-within:text-[color:var(--c-accent)]">
        {label}
      </label>
      <div className="relative mt-3">
        {children}
        {/* Focus draws a marigold line across the field, left to right. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[color:var(--c-accent)] transition-transform duration-500 ease-[var(--ease-vow)] group-focus-within:scale-x-100"
        />
      </div>
      {hint && <p className="mt-2 font-sans text-[0.76rem] text-paper/40">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full border-b border-paper/20 bg-transparent pt-1 pb-2.5 font-serif text-[clamp(1.3rem,1.1rem+0.6vw,1.65rem)] text-paper placeholder:text-paper/25 focus:outline-none';

function Switch({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-3.5 text-left font-sans text-[0.92rem] text-paper/80">
      <span
        className="relative h-[1.45rem] w-[2.6rem] shrink-0 rounded-full border transition-colors duration-300"
        style={{ borderColor: on ? ACCENT : 'rgba(245,241,234,0.3)', background: on ? ACCENT : 'transparent' }}
      >
        <span
          className="absolute top-1/2 left-[3px] size-[0.95rem] rounded-full transition-[transform,background-color] duration-300 ease-[var(--ease-vow)]"
          style={{ transform: `translate(${on ? '1.1rem' : '0'}, -50%)`, background: on ? NIGHT : 'rgba(245,241,234,0.85)' }}
        />
      </span>
      {children}
    </button>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 font-sans text-[0.88rem] transition-colors duration-300 hover:border-paper/50"
      style={{ borderColor: on ? ACCENT : 'rgba(245,241,234,0.2)', background: on ? ACCENT : 'transparent', color: on ? NIGHT : undefined }}
    >
      {children}
    </button>
  );
}

function Choice({ on, onClick, title, note, meta }: { on: boolean; onClick: () => void; title: string; note: string; meta?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="relative flex flex-col items-start rounded-[3px] border p-4 pr-9 text-left transition-colors duration-300 hover:border-paper/40"
      style={{ borderColor: on ? ACCENT : 'rgba(245,241,234,0.15)', background: on ? 'rgba(231,160,74,0.09)' : 'transparent' }}
    >
      <span className="font-serif text-[1.3rem] leading-tight">{title}</span>
      <span className="mt-1.5 font-sans text-[0.78rem] leading-snug text-paper/55">{note}</span>
      {meta && <span className="eyebrow mt-auto pt-4 text-[0.56rem] text-[color:var(--c-accent)]">{meta}</span>}
      <span
        aria-hidden
        className="absolute top-3.5 right-3.5 grid size-4 place-items-center rounded-full border transition-colors duration-300"
        style={{ borderColor: on ? ACCENT : 'rgba(245,241,234,0.3)', background: on ? ACCENT : 'transparent' }}
      >
        {on && <Check className="size-2.5 text-[#1d1a1f]" strokeWidth={3} />}
      </span>
    </button>
  );
}

/** The visitor's saved weddings and a direct line, shown beside the form (and under it on phones). */
function Aside({ picks, className = '' }: { picks: Wedding[]; className?: string }) {
  const hello = 'Hello Seven Vow Stories, we would love to talk about our wedding.';
  return (
    <div className={className}>
      {picks.length > 0 && (
        <div className="max-w-md border-t border-paper/10 pt-6">
          <p className="eyebrow text-[0.6rem] text-paper/50">From your shortlist</p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
            {picks.map((w) => (
              <li key={w.slug} className="flex items-center gap-3">
                <span className="relative size-10 shrink-0 overflow-hidden rounded-full">
                  <Image src={w.frames[0].src} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <span className="font-sans text-[0.86rem] text-paper/85">{w.couple}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-sans text-[0.8rem] leading-relaxed text-paper/45">
            We add these to your message, so we know the mood you are after.{' '}
            <Link href="/collection" onClick={curtainClick('/collection', LABELS.collection)} className="text-paper/75 underline underline-offset-4 hover:text-paper">
              Change
            </Link>
          </p>
        </div>
      )}
      <p className={`font-sans text-[0.86rem] leading-relaxed text-paper/50 ${picks.length ? 'mt-8' : ''}`}>
        Prefer to talk?{' '}
        <a href={whatsappHref(site.contact.whatsapp, hello)} target="_blank" rel="noopener noreferrer" className="text-paper/80 underline underline-offset-4 hover:text-paper">
          WhatsApp us
        </a>{' '}
        or write to{' '}
        <a href={`mailto:${site.contact.email}`} className="text-paper/80 underline underline-offset-4 hover:text-paper">
          {site.contact.email}
        </a>
        .
      </p>
    </div>
  );
}

export default function Concierge() {
  const [data, setData] = useState<Enquiry>(emptyEnquiry);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [review, setReview] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  // Restore and keep a draft (per-viewer convenience only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      // Restoring after hydration keeps server and client markup identical.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setData({ ...emptyEnquiry, ...JSON.parse(raw) });
    } catch {
      /* storage unavailable */
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable */
    }
  }, [data]);

  const set = <K extends keyof Enquiry>(k: K, v: Enquiry[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors([]);
  };

  const animateTo = (fn: () => void, dir: 1 | -1) => {
    const el = panel.current;
    if (!el) return fn();
    gsap.to(el, {
      opacity: 0,
      x: -24 * dir,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        fn();
        gsap.fromTo(el, { opacity: 0, x: 24 * dir }, { opacity: 1, x: 0, duration: 0.55, ease: 'vow' });
      },
    });
  };

  const next = () => {
    const errs = validateStep(step, data);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    if (step < STEPS.length - 1) animateTo(() => setStep(step + 1), 1);
    else animateTo(() => setReview(true), 1);
  };
  const back = () => {
    setErrors([]);
    if (review) animateTo(() => setReview(false), -1);
    else if (step > 0) animateTo(() => setStep(step - 1), -1);
  };
  // Finished steps can be revisited from the list.
  const goTo = (i: number) => {
    setErrors([]);
    animateTo(() => {
      setReview(false);
      setStep(i);
    }, -1);
  };

  // Weddings saved in the collection travel with the enquiry.
  const saved = useShortlist();
  const pickWeddings = useMemo(() => saved.map(weddingBySlug).filter((w) => w != null), [saved]);
  const picks = useMemo(() => pickWeddings.map((w) => `${w.couple}, ${shortCity(w)}`), [pickWeddings]);
  const message = useMemo(() => buildEnquiry(data, picks), [data, picks]);
  const done = review ? STEPS.length : step;

  return (
    <section
      id="concierge"
      data-tone="dark"
      aria-labelledby="concierge-title"
      // Clipped only sideways (the glow would widen the page on phones); layered over the footer so the calendar can
      // still spill past the bottom edge.
      className="relative z-[4] overflow-x-clip bg-[#1d1a1f] py-[clamp(5rem,14vh,9rem)] text-paper"
      style={{ '--c-accent': ACCENT } as React.CSSProperties}
    >
      <div className="grid gap-12 px-[var(--gutter)] lg:grid-cols-[0.85fr_1.15fr] lg:gap-[clamp(3rem,6vw,7rem)]">
        {/* ---------- Introduction and the steps ---------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow text-[0.62rem] text-paper/55">The concierge</p>
          {/* Light Cormorant italic, like "Seven short films" and the hero's couple line. */}
          <h2 id="concierge-title" className="headline mt-4 pl-[0.04em] text-[clamp(3.2rem,6.4vw,6.6rem)] font-normal italic">
            Begin your
            <br />
            <em className="text-[color:var(--c-accent)]">chapter</em>
          </h2>
          <p className="mt-6 max-w-md font-sans text-[0.98rem] leading-relaxed text-paper/65">
            Tell us about your wedding in five short steps. Your answers become a message you send us on WhatsApp or by email, and we
            reply within two days with dates and ideas.
          </p>

          <div className="relative mt-11 hidden max-w-xs lg:block">
            {/* The path between the steps fills in as each one is done. */}
            <span aria-hidden className="absolute top-5 bottom-5 left-[1.05rem] w-px bg-paper/12" />
            <span
              aria-hidden
              className="absolute top-5 left-[1.05rem] w-px bg-[color:var(--c-accent)] transition-[height] duration-700 ease-[var(--ease-vow)]"
              style={{ height: `calc((100% - 2.5rem) * ${Math.min(1, done / (STEPS.length - 1))})` }}
            />
          <ol className="relative" aria-label="Steps">
            {STEPS.map((s, i) => {
              const finished = review || i < step;
              const current = !review && i === step;
              return (
                <li key={s.title} className="relative">
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    disabled={!finished}
                    aria-current={current ? 'step' : undefined}
                    className="group flex w-full items-center gap-5 py-2 text-left disabled:cursor-default"
                  >
                    <span
                      className="relative grid size-[2.1rem] shrink-0 place-items-center rounded-full border font-serif text-[0.92rem] transition-colors duration-500"
                      style={{
                        borderColor: current || finished ? ACCENT : 'rgba(245,241,234,0.22)',
                        background: finished ? ACCENT : NIGHT,
                        color: finished ? NIGHT : current ? ACCENT : 'rgba(245,241,234,0.5)',
                      }}
                    >
                      {finished ? <Check className="size-3.5" strokeWidth={2.4} /> : NUMERALS[i]}
                    </span>
                    <span
                      className={`font-sans text-[0.92rem] transition-opacity duration-300 ${current ? 'opacity-100' : finished ? 'opacity-70 group-hover:opacity-100' : 'opacity-35'}`}
                    >
                      {s.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          </div>

          <Aside picks={pickWeddings} className="mt-11 hidden lg:block" />
        </div>

        {/* ---------- The form ---------- */}
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute -inset-16 bg-[radial-gradient(55%_50%_at_62%_32%,rgba(231,160,74,0.1),transparent_72%)]" />
          <div className="relative rounded-[4px] border border-paper/10 bg-white/[0.025] p-6 shadow-[0_50px_90px_-60px_rgba(0,0,0,0.9)] sm:p-10 lg:p-12">
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow text-[0.6rem] text-paper/50" aria-live="polite">
                {review ? 'Review & send' : `Step ${NUMERALS[step]} of V`}
              </p>
              <div className="hidden gap-1.5 lg:flex" aria-hidden>
                {STEPS.map((s, i) => (
                  <span
                    key={s.title}
                    className="h-[2px] w-6 rounded-full transition-colors duration-500 sm:w-9"
                    style={{ background: review || i <= step ? ACCENT : 'rgba(245,241,234,0.14)' }}
                  />
                ))}
              </div>
            </div>

            {/* Below lg the sidebar's step path is laid across the card instead; finished steps can be revisited. */}
            <div className="relative mt-6 lg:hidden">
              <span aria-hidden className="absolute top-1/2 right-[0.85rem] left-[0.85rem] h-px -translate-y-1/2 bg-paper/12" />
              <span
                aria-hidden
                className="absolute top-1/2 left-[0.85rem] h-px -translate-y-1/2 bg-[color:var(--c-accent)] transition-[width] duration-700 ease-[var(--ease-vow)]"
                style={{ width: `calc((100% - 1.7rem) * ${Math.min(1, done / (STEPS.length - 1))})` }}
              />
              <ol className="relative flex items-center justify-between" aria-label="Steps">
                {STEPS.map((s, i) => {
                  const finished = review || i < step;
                  const current = !review && i === step;
                  return (
                    <li key={s.title}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        disabled={!finished}
                        aria-current={current ? 'step' : undefined}
                        aria-label={`Step ${NUMERALS[i]}: ${s.title}`}
                        className="relative grid size-[1.7rem] place-items-center rounded-full border font-serif text-[0.78rem] transition-[background-color,border-color,color,transform] duration-500 ease-[var(--ease-vow)] disabled:cursor-default"
                        style={{
                          borderColor: current || finished ? ACCENT : 'rgba(245,241,234,0.22)',
                          background: finished ? ACCENT : NIGHT,
                          color: finished ? NIGHT : current ? ACCENT : 'rgba(245,241,234,0.5)',
                          transform: current ? 'scale(1.15)' : undefined,
                        }}
                      >
                        {finished ? <Check className="size-3" strokeWidth={2.4} /> : NUMERALS[i]}
                        {current && (
                          <span aria-hidden className="absolute -inset-1 animate-[halo_2.4s_ease-out_infinite] rounded-full border border-[color:var(--c-accent)]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div ref={panel} className="mt-8 min-h-[25rem]">
              <h3 className="headline text-[clamp(2.1rem,1.6rem+1.6vw,3rem)]">
                <em>{review ? 'Your message' : STEPS[step].title}</em>
              </h3>
              <p className="mt-2 font-sans text-[0.9rem] text-paper/50">
                {review ? 'Here is the note we have written for you. Send it however you like.' : STEPS[step].note}
              </p>

              <div className="mt-9">
                {!review && step === 0 && (
                  <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
                    <Field id="cg-a" label="Your name">
                      <input id="cg-a" className={inputCls} value={data.partnerA} onChange={(e) => set('partnerA', e.target.value)} placeholder="Aanya" autoComplete="given-name" />
                    </Field>
                    <Field id="cg-b" label="Your partner's name">
                      <input id="cg-b" className={inputCls} value={data.partnerB} onChange={(e) => set('partnerB', e.target.value)} placeholder="Kabir" />
                    </Field>
                    <Field id="cg-date" label="Wedding date">
                      <DateField
                        id="cg-date"
                        value={data.date}
                        onChange={(v) => set('date', v)}
                        disabled={data.dateOpen}
                        onUnsure={() => set('dateOpen', true)}
                      />
                    </Field>
                    <div className="flex items-end pb-2.5">
                      <Switch on={data.dateOpen} onChange={(v) => set('dateOpen', v)}>
                        We haven&apos;t fixed a date yet
                      </Switch>
                    </div>
                  </div>
                )}

                {!review && step === 1 && (
                  <div className="grid gap-10">
                    <Field id="cg-place" label="City or venue" hint="A city is enough if the venue isn't booked yet.">
                      <input id="cg-place" className={inputCls} value={data.place} onChange={(e) => set('place', e.target.value)} placeholder="Udaipur, a lakeside palace" />
                    </Field>
                    <fieldset>
                      <legend className="eyebrow text-[0.6rem] text-paper/50">Guests</legend>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {GUESTS.map((g) => (
                          <Chip key={g} on={data.guests === g} onClick={() => set('guests', g)}>
                            {g}
                          </Chip>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}

                {!review && step === 2 && (
                  <fieldset>
                    <legend className="sr-only">Celebrations</legend>
                    <div className="flex flex-wrap gap-2.5">
                      {events.map((ev) => {
                        const on = data.events.includes(ev);
                        return (
                          <Chip key={ev} on={on} onClick={() => set('events', on ? data.events.filter((x) => x !== ev) : [...data.events, ev])}>
                            {on && <Check className="size-3.5" strokeWidth={2.2} />} {ev}
                          </Chip>
                        );
                      })}
                    </div>
                    <p className="mt-7 font-sans text-[0.82rem] text-paper/45">Choose as many as you like.</p>
                  </fieldset>
                )}

                {!review && step === 3 && (
                  <div className="grid gap-9">
                    <fieldset>
                      <legend className="eyebrow text-[0.6rem] text-paper/50">Coverage</legend>
                      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                        {COVERAGE.map((c) => (
                          <Choice key={c.value} on={data.coverage === c.value} onClick={() => set('coverage', c.value)} title={c.value} note={c.note} />
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend className="eyebrow text-[0.6rem] text-paper/50">Package (optional)</legend>
                      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                        {collections.map((c) => {
                          const on = data.collection === c.name;
                          return (
                            <Choice key={c.id} on={on} onClick={() => set('collection', on ? '' : c.name)} title={c.name} note={c.summary} meta={c.price} />
                          );
                        })}
                      </div>
                    </fieldset>
                  </div>
                )}

                {!review && step === 4 && (
                  <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
                    <Field id="cg-phone" label="WhatsApp number">
                      <input id="cg-phone" type="tel" className={inputCls} value={data.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
                    </Field>
                    <Field id="cg-email" label="Email">
                      <input id="cg-email" type="email" className={inputCls} value={data.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field id="cg-notes" label="Anything we should know?" hint="Your story, a vow that matters to you, a song, a grandmother who must be in every frame.">
                        <textarea id="cg-notes" rows={3} className={`${inputCls} resize-none`} value={data.notes} onChange={(e) => set('notes', e.target.value)} placeholder="We met at…" />
                      </Field>
                    </div>
                  </div>
                )}

                {review && (
                  <div>
                    <div className="rounded-[3px] border border-paper/12 bg-paper/[0.035] p-6 sm:p-8">
                      <p className="headline text-[clamp(1.9rem,1.4rem+1.4vw,2.6rem)]">
                        {data.partnerA} <em className="text-[color:var(--c-accent)]">&amp;</em> {data.partnerB}
                      </p>
                      <dl className="mt-6 grid gap-x-8 gap-y-5 font-sans text-[0.88rem] sm:grid-cols-2">
                        {[
                          ['Date', data.dateOpen ? 'Not fixed yet' : prettyDate(data.date)],
                          ['Where', data.place],
                          ['Guests', data.guests || '—'],
                          ['Celebrations', data.events.join(', ')],
                          ['Coverage', data.coverage],
                          ['Package', data.collection || 'Not sure yet'],
                          ['WhatsApp', data.phone || '—'],
                          ['Email', data.email || '—'],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <dt className="eyebrow text-[0.56rem] text-paper/45">{k}</dt>
                            <dd className="mt-1 text-paper/90">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      {picks.length > 0 && (
                        <div className="mt-6 border-t border-paper/10 pt-5">
                          <p className="eyebrow text-[0.56rem] text-paper/45">Saved from the collection</p>
                          <p className="mt-1 font-sans text-[0.88rem] text-paper/90">{picks.join(' · ')}</p>
                        </div>
                      )}
                      {data.notes && <p className="serif-italic mt-6 border-t border-paper/10 pt-5 text-[1.15rem] text-paper/80">“{data.notes}”</p>}
                    </div>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <a href={whatsappHref(site.contact.whatsapp, message)} target="_blank" rel="noopener noreferrer" className="btn-pill bg-[color:var(--c-accent)] text-[#1d1a1f] hover:bg-paper">
                        <MessageCircle className="size-4" strokeWidth={1.8} /> Send on WhatsApp
                      </a>
                      <a href={emailHref(site.contact.email, data, message)} className="btn-pill border border-paper/30 hover:border-paper">
                        <Mail className="size-4" strokeWidth={1.6} /> Send by email
                      </a>
                    </div>
                    <p className="mt-5 font-sans text-[0.78rem] text-paper/40">
                      Opens WhatsApp or your email app with the message written for you. Nothing is sent until you press send there.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {errors.length > 0 && (
              <ul className="mt-6 space-y-1 font-sans text-[0.85rem] text-[#f0a58f]" role="alert">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}

            <div className="mt-9 flex items-center justify-between gap-4 border-t border-paper/10 pt-6">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 && !review}
                className="flex items-center gap-2 font-sans text-[0.76rem] tracking-[0.16em] text-paper/65 uppercase transition-opacity hover:text-paper disabled:pointer-events-none disabled:opacity-0"
              >
                <ArrowLeft className="size-4" strokeWidth={1.5} /> Back
              </button>
              {!review && (
                <button type="button" onClick={next} className="btn-pill bg-paper text-[#1d1a1f] hover:bg-[color:var(--c-accent)]">
                  {step === STEPS.length - 1 ? 'Review' : 'Continue'} <ArrowRight className="size-4" strokeWidth={1.6} />
                </button>
              )}
            </div>
          </div>

          <Aside picks={pickWeddings} className="mt-10 lg:hidden" />
        </div>
      </div>
    </section>
  );
}
