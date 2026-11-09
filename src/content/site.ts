// Studio-wide copy and settings. WhatsApp, Instagram and YouTube are the studio's real channels; the email
// address and the packages ("collections") are still PLACEHOLDERS until the studio confirms them.

export const site = {
  name: 'Seven Vow Stories',
  short: 'SVS',
  tagline: 'Wedding films & editorial photography',
  chapterLabel: 'The Saptapadi',
  description:
    'Seven Vow Stories makes cinematic wedding films and editorial photography across India, told the way the Saptapadi is: one vow, one step, one story at a time.',
  url: 'https://sevenvowstories.example',
  contact: {
    // From the studio's Instagram bio. Their link there (wa.me/9199291919) leaves out India's country code,
    // which WhatsApp cannot read; with 91 added it resolves to +91 91992 91919. CONFIRM with the studio.
    whatsapp: '919199291919',
    whatsappDisplay: '+91 91992 91919',
    // PLACEHOLDER: replace with the studio's enquiry inbox.
    email: 'hello@sevenvowstories.example',
    city: 'Based in India · Travelling everywhere',
    instagram: 'https://www.instagram.com/sevenvowstories/',
    instagramHandle: '@sevenvowstories',
    youtube: 'https://www.youtube.com/@sevenvowstories2127',
  },
  disclaimer:
    'Couples, names and stories on this site are fictional samples. Photographs are CC0 placeholder images and the films are built from them; they will be replaced with the studio’s own work.',
};

export const about = {
  eyebrow: 'About the studio',
  title: 'We film weddings the way they are remembered.',
  body: [
    'The Saptapadi is seven steps and seven promises. We think every wedding has its own version of each one: a meal, a storm, a family, a friendship.',
    'Seven Vow Stories is a small team of filmmakers and editorial photographers. We work unobtrusively, mostly with available light, and we cut films like short stories rather than highlight reels.',
    'Every couple gets a chapter: a film, an editorial photo book, and a story told in their own words.',
  ],
  principles: [
    { title: 'Story first', body: 'Before the wedding we sit down with you and find the vow your story is really about.' },
    { title: 'Quiet presence', body: 'Small crew, long lenses, no staged chaos. Your guests should forget we are there.' },
    { title: 'Made to last', body: 'Films graded and mastered for the big screen, photographs printed in archival books.' },
  ],
};

export const collections = [
  {
    id: 'first-step',
    name: 'The First Step',
    summary: 'Editorial photography for one day of celebrations.',
    includes: ['One lead photographer', 'One day of coverage', 'Online gallery and print-ready files'],
    price: 'On request',
  },
  {
    id: 'seven-steps',
    name: 'The Seven Steps',
    summary: 'A film and photography for the full wedding.',
    includes: ['Film crew and photographers', 'Up to three days of coverage', 'Chapter film and editorial gallery'],
    price: 'On request',
  },
  {
    id: 'saptapadi',
    name: 'The Saptapadi Signature',
    summary: 'Our complete documentary chapter, from roka to reception.',
    includes: ['Full documentary film', 'Pre-wedding chapter', 'Hand-bound editorial book'],
    price: 'On request',
  },
] as const;

export const events = ['Roka', 'Haldi', 'Mehendi', 'Sangeet', 'Pheras', 'Reception', 'Pre-wedding'] as const;

// Where the studio can be followed or reached, in display order.
export const socials = [
  { kind: 'instagram', label: 'Instagram', href: site.contact.instagram, detail: site.contact.instagramHandle },
  { kind: 'youtube', label: 'YouTube', href: site.contact.youtube, detail: 'Wedding films' },
  { kind: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${site.contact.whatsapp}`, detail: site.contact.whatsappDisplay },
] as const;

// Floating section pill on the home page. `short` is the phone label; `wide` items only show from sm up.
export const nav: { label: string; href: string; short?: string; wide?: boolean }[] = [
  { label: 'Stories', href: '/#lookbook' },
  { label: 'Films', href: '/#films' },
  { label: 'Collection', href: '/collection' },
  { label: 'Archive', href: '/#archive', wide: true },
  { label: 'Book a date', href: '/#concierge', short: 'Book' },
];
