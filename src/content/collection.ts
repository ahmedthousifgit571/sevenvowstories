// The Collection: every wedding in the portfolio, browsed like a lookbook (grid, filters, detail pages).
// The first seven are the Saptapadi chapters; the rest are archive weddings. Couples and copy are fictional
// samples and the photographs are CC0 placeholders (see credits.ts), like the rest of the site.
import { stories } from './stories';
import { imageMeta } from './image-meta';

export type Season = 'Winter' | 'Spring' | 'Summer' | 'Monsoon' | 'Autumn';
export type Coverage = 'Film + photography' | 'Photography';

export type Frame = { src: string; w: number; h: number; caption: string };

export type Wedding = {
  slug: string;
  couple: string;
  city: string;
  region: string;
  venue: string;
  setting: string;
  season: Season;
  /** e.g. "February 2026" */
  month: string;
  year: string;
  celebrations: string[];
  light: string;
  coverage: Coverage;
  tagline: string;
  description: string;
  crew: string;
  delivered: string;
  /** shown in the archive list on the home page */
  archiveLabel: string;
  frames: Frame[];
  /** index into stories when the wedding is one of the seven chapters */
  storyIndex: number | null;
};

export const collectionMeta = {
  eyebrow: 'Seven Vow Stories',
  title: 'Chapter: The Saptapadi',
  intro:
    'Chapter: The Saptapadi spans twelve weddings across India, from haldi mornings and monsoon pheras to palace evenings and lamplit ghats. Each one is filmed and photographed as its own story. One collection, as many versions of a wedding as there are couples.',
  reel: {
    landscape: '/films/collection-reel.mp4',
    landscapePoster: '/films/collection-reel.webp',
    portrait: '/films/collection-reel-portrait.mp4',
    portraitPoster: '/films/collection-reel-portrait.webp',
  },
};

// Frames keep their true size so the detail page never crops a composition.
const frame = (src: string, caption: string): Frame => {
  const [w, h] = imageMeta[src] ?? [1200, 1500];
  return { src, w, h, caption };
};
const v = (n: number, k: string) => `/images/vow-${n}/${k}.jpg`;
const ar = (n: number) => `/images/archive/${String(n).padStart(2, '0')}.jpg`;

type Extra = Omit<Wedding, 'couple' | 'city' | 'venue' | 'month' | 'year' | 'description' | 'archiveLabel' | 'storyIndex' | 'slug'>;

// Chapter weddings: the story copy lives in stories.ts; these are the facets the collection adds.
const chapterFacets: Extra[] = [
  {
    region: 'Rajasthan',
    setting: 'Haveli',
    season: 'Winter',
    celebrations: ['Haldi', 'Mehendi', 'Pheras'],
    light: 'Morning light',
    coverage: 'Film + photography',
    tagline: 'Two families, one table and a haldi-gold morning',
    crew: 'Two filmmakers, two photographers',
    delivered: 'Chapter film, 620 photographs, editorial book',
    frames: [
      frame(v(1, 'poster'), 'Hands in the haldi bowl, rose petals floating'),
      frame(v(1, 'a'), 'A peacock gate painted in five colours'),
      frame(v(1, 'd'), 'Rose petals in a marble bowl'),
      frame(v(1, 'c'), 'The thali that started it all'),
      frame(v(1, 'b'), 'Marigolds for the courtyard'),
    ],
  },
  {
    region: 'Kerala',
    setting: 'Backwaters',
    season: 'Monsoon',
    celebrations: ['Mehendi', 'Pheras', 'Sadhya'],
    light: 'Rain light',
    coverage: 'Film + photography',
    tagline: 'Vows on a houseboat, with the rain drumming on the roof',
    crew: 'Two filmmakers, one photographer',
    delivered: 'Chapter film, 480 photographs, editorial book',
    frames: [
      frame(v(2, 'poster'), 'Hands joined over betel leaves'),
      frame(v(2, 'a'), 'The houseboat on the backwaters'),
      frame(v(2, 'b'), 'A white Kerala house among the palms'),
      frame(v(2, 'd'), 'Wet steps through the forest after the rain'),
    ],
  },
  {
    region: 'Rajasthan',
    setting: 'Palace',
    season: 'Autumn',
    celebrations: ['Sangeet', 'Pheras', 'Reception'],
    light: 'Golden hour',
    coverage: 'Film + photography',
    tagline: 'A palace wedding inside the last hour of light',
    crew: 'Three filmmakers, two photographers',
    delivered: 'Chapter film, 750 photographs, editorial book',
    frames: [
      frame(v(3, 'poster'), 'Bangles and henna before the pheras'),
      frame(v(3, 'a'), 'Palace walls and a sky full of pigeons'),
      frame(v(3, 'b'), 'A sandstone chhatri against the hills'),
      frame(v(3, 'c'), 'Hawa Mahal in the afternoon light'),
      frame(v(3, 'd'), 'A silk sari border in gold'),
    ],
  },
  {
    region: 'Tamil Nadu',
    setting: 'Mansion',
    season: 'Winter',
    celebrations: ['Nichayathartham', 'Muhurtham'],
    light: 'Daylight',
    coverage: 'Film + photography',
    tagline: 'Four generations under one Chettinad roof',
    crew: 'Two filmmakers, two photographers',
    delivered: 'Chapter film, 560 photographs, editorial book',
    frames: [
      frame(v(4, 'poster'), 'Hands held through the ceremony'),
      frame(v(4, 'b'), 'The groom’s turban, waiting'),
      frame(v(4, 'a'), 'Carved sandstone and latticed windows'),
      frame(v(4, 'c'), 'Clay cups between the rituals'),
      frame(v(4, 'd'), 'A woven sari fragment'),
    ],
  },
  {
    region: 'Uttar Pradesh',
    setting: 'Riverside',
    season: 'Spring',
    celebrations: ['Haldi', 'Pheras', 'Ganga aarti'],
    light: 'Lamplight',
    coverage: 'Film + photography',
    tagline: 'Forty-one diyas on the Ganga at dusk',
    crew: 'Two filmmakers, one photographer',
    delivered: 'Chapter film, 430 photographs, editorial book',
    frames: [
      frame(v(5, 'poster'), 'A single diya in the dark'),
      frame(v(5, 'b'), 'Morning prayers on the ghats'),
      frame(v(5, 'c'), 'Flowers and lamps for the aarti'),
      frame(v(5, 'a'), 'Boats moored below the ghats'),
      frame(v(5, 'd'), 'A clay lamp on a bed of rice'),
    ],
  },
  {
    region: 'Kashmir',
    setting: 'Mountains',
    season: 'Winter',
    celebrations: ['Livun', 'Pheras', 'Reception'],
    light: 'Snow light',
    coverage: 'Film + photography',
    tagline: 'A shikara in autumn, pheras in the snow',
    crew: 'Two filmmakers, two photographers',
    delivered: 'Chapter film, 590 photographs, editorial book',
    frames: [
      frame(v(6, 'poster'), 'A shikara on Dal Lake at dusk'),
      frame(v(6, 'a'), 'Gulmarg after the first heavy snow'),
      frame(v(6, 'b'), 'Spring returning to the valley'),
      frame(v(6, 'c'), 'A mountain stream through the pines'),
      frame(v(6, 'd'), 'One marigold left over from December'),
    ],
  },
  {
    region: 'Goa',
    setting: 'Beach',
    season: 'Spring',
    celebrations: ['Mehendi', 'Sangeet', 'Pheras'],
    light: 'Sunrise',
    coverage: 'Film + photography',
    tagline: 'Best friends since school, barefoot at sunrise',
    crew: 'Two filmmakers, two photographers',
    delivered: 'Chapter film, 610 photographs, editorial book',
    frames: [
      frame(v(7, 'poster'), 'The necklace, a moment before'),
      frame(v(7, 'a'), 'Palms over the Arabian Sea'),
      frame(v(7, 'd'), 'Sunrise at the fishing jetty'),
      frame(v(7, 'c'), 'A yellow house in Fontainhas'),
      frame(v(7, 'b'), 'The shore from above'),
    ],
  },
];

const slugify = (couple: string) =>
  couple
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const seasonYear = (month: string) => month.split(' ')[1] ?? '';

const fromStories: Wedding[] = stories.map((s, i) => {
  const f = chapterFacets[i];
  return {
    ...f,
    slug: slugify(s.couple),
    couple: s.couple,
    city: s.city,
    venue: s.details.find((d) => d.label === 'Venue')?.value ?? s.venue,
    month: s.date,
    year: seasonYear(s.date),
    description: s.excerpt,
    archiveLabel: `Vow ${s.numeral}`,
    storyIndex: i,
  };
});

const extras: Wedding[] = [
  {
    slug: 'simran-and-arjun',
    couple: 'Simran & Arjun',
    city: 'Amritsar',
    region: 'Punjab',
    venue: 'Gurdwara in the old city, Amritsar',
    setting: 'Gurdwara',
    season: 'Winter',
    month: 'January 2025',
    year: '2025',
    celebrations: ['Jaago', 'Anand Karaj', 'Reception'],
    light: 'Morning light',
    coverage: 'Film + photography',
    tagline: 'Four laavan at first light, after a jaago that lasted till morning',
    description:
      'Simran’s family has sung at the same gurdwara for three generations. The Anand Karaj began at first light; the jaago the night before had only just finished.',
    crew: 'Two filmmakers, two photographers',
    delivered: 'Wedding film, 540 photographs, printed album',
    archiveLabel: 'Anand Karaj',
    storyIndex: null,
    frames: [frame(ar(7), 'The groom’s kalgi and turban'), frame(ar(1), 'The bride’s hands folded in prayer')],
  },
  {
    slug: 'diya-and-aarav',
    couple: 'Diya & Aarav',
    city: 'Hampi',
    region: 'Karnataka',
    venue: 'Boulder hills, Hampi',
    setting: 'Temple ruins',
    season: 'Winter',
    month: 'December 2025',
    year: '2025',
    celebrations: ['Haldi', 'Muhurtham', 'Reception'],
    light: 'Golden hour',
    coverage: 'Photography',
    tagline: 'A muhurtham among the boulders, timed to the sunset',
    description:
      'Diya and Aarav chose Hampi for the boulders and the light. The ceremony was timed to the last half hour of sun, with the ruins turning copper behind them.',
    crew: 'Two photographers',
    delivered: '460 photographs, printed album',
    archiveLabel: 'Vow III',
    storyIndex: null,
    frames: [frame(ar(2), 'Bangles, henna and silk'), frame(ar(3), 'Henna-patterned feet and anklets')],
  },
  {
    slug: 'mira-and-jai',
    couple: 'Mira & Jai',
    city: 'Mumbai',
    region: 'Maharashtra',
    venue: 'Sea-facing terrace, Marine Drive',
    setting: 'City terrace',
    season: 'Spring',
    month: 'March 2026',
    year: '2026',
    celebrations: ['Sangeet', 'Pheras', 'Reception'],
    light: 'City night',
    coverage: 'Film + photography',
    tagline: 'A city wedding above the sea, half of it in black and white',
    description:
      'Mira and Jai met on a local train and married on a terrace above Marine Drive. Half the film is in black and white, because Jai’s grandfather asked for it.',
    crew: 'Two filmmakers, two photographers',
    delivered: 'Wedding film, 500 photographs, printed album',
    archiveLabel: 'Vow VII',
    storyIndex: null,
    frames: [frame(ar(11), 'Rings and bangles, in black and white'), frame(ar(5), 'White flowers for the reception')],
  },
  {
    slug: 'ananya-and-siddharth',
    couple: 'Ananya & Siddharth',
    city: 'Coorg',
    region: 'Karnataka',
    venue: 'Coffee estate, Coorg hills',
    setting: 'Coffee estate',
    season: 'Monsoon',
    month: 'September 2025',
    year: '2025',
    celebrations: ['Mehendi', 'Sangeet', 'Pheras'],
    light: 'Lamplight',
    coverage: 'Film + photography',
    tagline: 'Mist over the coffee and a canopy of a thousand lights',
    description:
      'The rain stopped an hour before the sangeet, and the estate team strung a canopy of lights between the silver oaks. Ananya calls it the best hour of her life.',
    crew: 'Two filmmakers, one photographer',
    delivered: 'Wedding film, 470 photographs, printed album',
    archiveLabel: 'Vow VI',
    storyIndex: null,
    frames: [frame(ar(6), 'A canopy of lights for the sangeet'), frame(ar(4), 'Hands cupping a conch shell')],
  },
  {
    slug: 'pooja-and-nikhil',
    couple: 'Pooja & Nikhil',
    city: 'Rishikesh',
    region: 'Uttarakhand',
    venue: 'Riverside ashram, Rishikesh',
    setting: 'Riverside',
    season: 'Spring',
    month: 'April 2026',
    year: '2026',
    celebrations: ['Haldi', 'Mehendi', 'Pheras'],
    light: 'Morning light',
    coverage: 'Photography',
    tagline: 'Eleven hours of henna and pheras beside the river',
    description:
      'Pooja’s mehendi took eleven hours and two artists. The pheras were held on the steps of a riverside ashram, with the Ganga loud enough to drown out the priest.',
    crew: 'Two photographers',
    delivered: '420 photographs, printed album',
    archiveLabel: 'Vow II',
    storyIndex: null,
    frames: [
      frame(ar(9), 'Henna hands holding betel nuts'),
      frame(ar(8), 'Henna finished at midnight'),
      frame(ar(10), 'Two hands of henna, side by side'),
    ],
  },
];

export const weddings: Wedding[] = [...fromStories, ...extras];

export function weddingBySlug(slug: string) {
  return weddings.find((w) => w.slug === slug);
}

export function weddingForStory(storyIndex: number) {
  return weddings.find((w) => w.storyIndex === storyIndex);
}

/** "Alleppey" from "Alleppey, Kerala" style city strings. */
export const shortCity = (w: Wedding) => w.city.split(',')[0];

// ---------- Filters ----------

export type FacetKey = 'celebrations' | 'region' | 'setting' | 'season' | 'light' | 'coverage';
export type Filters = Partial<Record<FacetKey, string[]>>;

export const FACETS: { key: FacetKey; label: string }[] = [
  { key: 'celebrations', label: 'Celebration' },
  { key: 'region', label: 'Region' },
  { key: 'setting', label: 'Setting' },
  { key: 'season', label: 'Season' },
  { key: 'light', label: 'Light' },
  { key: 'coverage', label: 'Coverage' },
];

const SEASON_ORDER: Season[] = ['Winter', 'Spring', 'Summer', 'Monsoon', 'Autumn'];

export const valuesOf = (w: Wedding, key: FacetKey): string[] => {
  const val = w[key];
  return Array.isArray(val) ? val : [val];
};

/** Within a facet any ticked value matches; across facets every facet must match. */
export function matches(w: Wedding, filters: Filters, skip?: FacetKey) {
  return FACETS.every(({ key }) => {
    if (key === skip) return true;
    const want = filters[key];
    if (!want?.length) return true;
    return valuesOf(w, key).some((x) => want.includes(x));
  });
}

/** Options for a facet with live counts that respect the other facets' ticks. */
export function facetOptions(key: FacetKey, filters: Filters) {
  const all = new Map<string, number>();
  for (const w of weddings) for (const val of valuesOf(w, key)) all.set(val, 0);
  for (const w of weddings) {
    if (!matches(w, filters, key)) continue;
    for (const val of valuesOf(w, key)) all.set(val, (all.get(val) ?? 0) + 1);
  }
  const total = (val: string) => weddings.filter((w) => valuesOf(w, key).includes(val)).length;
  return [...all.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (key === 'season') return SEASON_ORDER.indexOf(a.value as Season) - SEASON_ORDER.indexOf(b.value as Season);
      return total(b.value) - total(a.value) || a.value.localeCompare(b.value);
    });
}

export const filterCount = (filters: Filters) => Object.values(filters).reduce((n, list) => n + (list?.length ?? 0), 0);

// ---------- Related weddings ----------

function similarity(a: Wedding, b: Wedding) {
  let score = 0;
  if (a.region === b.region) score += 3;
  if (a.setting === b.setting) score += 3;
  if (a.season === b.season) score += 2;
  if (a.light === b.light) score += 2;
  score += a.celebrations.filter((c) => b.celebrations.includes(c)).length;
  return score;
}

export function relatedTabs(w: Wedding) {
  const others = weddings.filter((o) => o.slug !== w.slug);
  const tabs = [
    { id: 'similar', label: 'Similar mood', items: [...others].sort((a, b) => similarity(w, b) - similarity(w, a)) },
    { id: 'season', label: `${w.season} weddings`, items: others.filter((o) => o.season === w.season) },
    { id: 'region', label: `More from ${w.region}`, items: others.filter((o) => o.region === w.region) },
    { id: 'chapters', label: 'The seven chapters', items: others.filter((o) => o.storyIndex != null) },
  ];
  return tabs.filter((t, i) => i === 0 || t.items.length >= 2);
}
