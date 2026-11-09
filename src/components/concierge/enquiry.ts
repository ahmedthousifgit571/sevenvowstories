// Enquiry model, validation and the WhatsApp / email hand-off links.

export type Enquiry = {
  partnerA: string;
  partnerB: string;
  date: string;
  dateOpen: boolean;
  place: string;
  guests: string;
  events: string[];
  coverage: string;
  collection: string;
  phone: string;
  email: string;
  notes: string;
};

export const emptyEnquiry: Enquiry = {
  partnerA: '',
  partnerB: '',
  date: '',
  dateOpen: false,
  place: '',
  guests: '',
  events: [],
  coverage: '',
  collection: '',
  phone: '',
  email: '',
  notes: '',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s()-]{7,}$/;

export function validateStep(step: number, d: Enquiry): string[] {
  const e: string[] = [];
  if (step === 0) {
    if (!d.partnerA.trim() || !d.partnerB.trim()) e.push('Please add both of your names.');
    if (!d.dateOpen && !d.date) e.push('Choose a date, or let us know it isn’t fixed yet.');
  }
  if (step === 1 && !d.place.trim()) e.push('Tell us the city or venue.');
  if (step === 2 && d.events.length === 0) e.push('Pick at least one celebration.');
  if (step === 3 && !d.coverage) e.push('Choose film, photography, or both.');
  if (step === 4) {
    const hasPhone = d.phone.trim() !== '';
    const hasEmail = d.email.trim() !== '';
    if (!hasPhone && !hasEmail) e.push('Add a WhatsApp number or an email so we can reply.');
    if (hasPhone && !PHONE.test(d.phone.trim())) e.push('That phone number doesn’t look right.');
    if (hasEmail && !EMAIL.test(d.email.trim())) e.push('That email address doesn’t look right.');
  }
  return e;
}

export function prettyDate(iso: string) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** `picks` are weddings the couple saved from the collection, e.g. "Aanya & Kabir, Jaipur". */
export function buildEnquiry(d: Enquiry, picks: string[] = []) {
  const lines: (string | null)[] = [
    `Hello Seven Vow Stories,`,
    ``,
    `We are ${d.partnerA.trim()} & ${d.partnerB.trim()} and we'd love to talk about our wedding.`,
    ``,
    `Date: ${d.dateOpen ? 'not fixed yet' : prettyDate(d.date)}`,
    `Where: ${d.place.trim()}`,
    d.guests ? `Guests: ${d.guests}` : null,
    `Celebrations: ${d.events.join(', ')}`,
    `Coverage: ${d.coverage}`,
    d.collection ? `Package: ${d.collection}` : null,
    picks.length ? `\nWeddings we loved in your collection: ${picks.join('; ')}` : null,
    d.notes.trim() ? `\nA little about us: ${d.notes.trim()}` : null,
    ``,
    `Reach us on: ${[d.phone.trim(), d.email.trim()].filter(Boolean).join(' / ')}`,
  ];
  return lines.filter((l): l is string => l !== null).join('\n').trim();
}

export function whatsappHref(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

export function emailHref(to: string, d: Enquiry, message: string) {
  const subject = `Wedding enquiry: ${d.partnerA} & ${d.partnerB}${d.dateOpen || !d.date ? '' : `, ${prettyDate(d.date)}`}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
