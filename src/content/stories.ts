// The seven chapters. Each is one vow of the Saptapadi told through a couple.
// Couples, dates and stories are fictional sample content; imagery is CC0 placeholder stock (see credits.ts).
// Kept free of path aliases and non-erasable TS so `scripts/*.mjs` can import it directly under Node 22.

export type PosterFont = 'rozha' | 'italiana' | 'monoton' | 'dmserif' | 'gloock' | 'poiret' | 'cormorant';

export type Palette = {
  /** poster paper */
  paper: string;
  /** poster + hero ink */
  ink: string;
  /** highlight colour */
  accent: string;
  /** chapter page background */
  pageBg: string;
  /** text on the chapter page background */
  pageInk: string;
};

export type Act = { label: string; title: string; body: string[]; images: string[] };

export type Story = {
  slug: string;
  index: number;
  numeral: string;
  theme: string;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  couple: string;
  venue: string;
  city: string;
  date: string;
  posterTitle: string[];
  posterFont: PosterFont;
  posterTagline: string;
  palette: Palette;
  /** Ring hero text: words prefixed with ~ are set small. */
  heroLine: string;
  excerpt: string;
  acts: Act[];
  details: { label: string; value: string }[];
  images: { poster: string; a: string; b: string; c: string; d: string };
};

const img = (vow: number, k: string) => `/images/vow-${vow}/${k}.jpg`;
const imgs = (vow: number) => ({ poster: img(vow, 'poster'), a: img(vow, 'a'), b: img(vow, 'b'), c: img(vow, 'c'), d: img(vow, 'd') });

export const stories: Story[] = [
  {
    slug: 'the-feast-of-firsts',
    index: 0,
    numeral: 'I',
    theme: 'Nourishment',
    sanskrit: 'इषे एकपदी भव',
    transliteration: 'Ishe ekapadi bhava',
    meaning: 'Take the first step, that we may always nourish each other.',
    couple: 'Aanya & Kabir',
    venue: 'A family haveli',
    city: 'Jaipur',
    date: 'February 2026',
    posterTitle: ['The Feast', 'of Firsts'],
    posterFont: 'rozha',
    posterTagline: 'Two families ~and one table ~in ~a ~film ~by Seven+Vow+Stories',
    palette: { paper: '#F8E6C2', ink: '#7A2E0E', accent: '#E0861E', pageBg: '#7E3412', pageInk: '#FBEBD0' },
    heroLine:
      'Two FAMILIES, ~one TABLE ~and ~a HALDI-GOLD MORNING ~as AANYA ~and KABIR TAKE ~the FIRST STEP: ~to NOURISH ~each OTHER.',
    excerpt:
      'A haldi that turned into a feast. Aanya’s grandmother cooked for three days, and the first vow was taken over a thali shared by two families who had only just met.',
    acts: [
      {
        label: 'Chapter I',
        title: 'The Vow',
        body: [
          'The first of the seven steps asks for nourishment. Not only food, but the everyday care of making sure the other is fed, rested and seen.',
          'In a Jaipur haveli painted with peacocks, Aanya and Kabir began their wedding the way her family begins everything: at the table.',
        ],
        images: [img(1, 'a'), img(1, 'c')],
      },
      {
        label: 'Chapter II',
        title: 'The Haldi',
        body: [
          'Turmeric, rose water and a hundred cousins. The haldi bowl went round the courtyard twice before anyone noticed the marigolds had run out.',
          'We filmed it close and unhurried: hands, petals, the gold staining everything it touched.',
        ],
        images: [img(1, 'poster'), img(1, 'd')],
      },
      {
        label: 'Chapter III',
        title: 'Ever After',
        body: [
          'By evening the courtyard was a dining hall. Kabir’s father gave a speech about mangoes that nobody fully understood and everybody applauded.',
          'The film ends where it began, with a full table, now one family longer.',
        ],
        images: [img(1, 'b')],
      },
    ],
    details: [
      { label: 'Venue', value: 'Family haveli, Jaipur' },
      { label: 'Celebrations', value: 'Haldi · Mehendi · Pheras' },
      { label: 'Coverage', value: 'Film + editorial photography' },
    ],
    images: imgs(1),
  },
  {
    slug: 'monsoon-oath',
    index: 1,
    numeral: 'II',
    theme: 'Strength',
    sanskrit: 'ऊर्जे द्विपदी भव',
    transliteration: 'Urje dvipadi bhava',
    meaning: 'Take the second step, that we may be each other’s strength.',
    couple: 'Meera & Arjun',
    venue: 'A backwater houseboat',
    city: 'Alleppey, Kerala',
    date: 'July 2025',
    posterTitle: ['Monsoon', 'Oath'],
    posterFont: 'italiana',
    posterTagline: 'Rain ~on ~the backwaters ~and ~a promise ~kept ~in ~a ~film ~by Seven+Vow+Stories',
    palette: { paper: '#DCEAE4', ink: '#0F4B48', accent: '#2C8A82', pageBg: '#0E3D3B', pageInk: '#E2F1EC' },
    heroLine:
      'WHEN ~the MONSOON BROKE ~over ~the BACKWATERS, MEERA ~and ARJUN TOOK ~the SECOND STEP: ~to BE ~each OTHER’S STRENGTH.',
    excerpt:
      'They planned a dry-season wedding. The monsoon arrived three weeks early, and Meera and Arjun said their vows on a houseboat with the rain drumming on the roof.',
    acts: [
      {
        label: 'Chapter I',
        title: 'The Vow',
        body: [
          'The second step is for strength: of body, of mind, and of the kind that holds when plans fall apart.',
          'Meera and Arjun’s plans fell apart beautifully. The rain came early and stayed, and the wedding moved onto the water.',
        ],
        images: [img(2, 'a'), img(2, 'b')],
      },
      {
        label: 'Chapter II',
        title: 'The Ceremony',
        body: [
          'A houseboat, a priest who had performed weddings in worse weather, and forty guests under one canopy.',
          'Their hands never let go during the pheras. We kept the camera on them and let the rain do the scoring.',
        ],
        images: [img(2, 'poster'), img(2, 'd')],
      },
      {
        label: 'Chapter III',
        title: 'Ever After',
        body: [
          'When the clouds finally lifted, the backwaters were glass. The couple took a canoe out alone for ten minutes, which is how the film ends.',
        ],
        images: [img(2, 'c')],
      },
    ],
    details: [
      { label: 'Venue', value: 'Houseboat, Alleppey backwaters' },
      { label: 'Celebrations', value: 'Mehendi · Pheras · Sadhya' },
      { label: 'Coverage', value: 'Film + editorial photography' },
    ],
    images: imgs(2),
  },
  {
    slug: 'gold-hour',
    index: 2,
    numeral: 'III',
    theme: 'Prosperity',
    sanskrit: 'रायस्पोषाय त्रिपदी भव',
    transliteration: 'Rayas poshaya tripadi bhava',
    meaning: 'Take the third step, that we may build a life of plenty together.',
    couple: 'Tara & Vikram',
    venue: 'A lakeside palace',
    city: 'Udaipur',
    date: 'November 2025',
    posterTitle: ['Gold', 'Hour'],
    posterFont: 'monoton',
    posterTagline: 'Gold ~on ~the lake, gold ~on ~her wrists ~in ~a ~film ~by Seven+Vow+Stories',
    palette: { paper: '#F3E8CF', ink: '#5F4512', accent: '#C2963A', pageBg: '#4F3A10', pageInk: '#F7EBCF' },
    heroLine:
      'GOLD ~on ~the LAKE, GOLD ~on ~her WRISTS ~and ~in UDAIPUR ~a THIRD STEP: ~to BUILD ~a LIFE ~of PLENTY, TOGETHER.',
    excerpt:
      'A palace wedding filmed almost entirely in the last hour of light. Tara wore her mother’s bangles, and Vikram counted every one of them during the pheras.',
    acts: [
      {
        label: 'Chapter I',
        title: 'The Vow',
        body: [
          'Prosperity, in the third vow, is a shared one: a home, a harvest, a future you build with your own hands.',
          'Tara and Vikram chose Udaipur because the lake turns to gold an hour before sunset, and they wanted their vows inside that hour.',
        ],
        images: [img(3, 'a'), img(3, 'b')],
      },
      {
        label: 'Chapter II',
        title: 'The Ceremony',
        body: [
          'Twenty-one bangles, each one a story from a different aunt. We filmed them like heirlooms, because they are.',
          'The pheras began at 5:12 pm and ended as the last light left the water.',
        ],
        images: [img(3, 'poster'), img(3, 'd')],
      },
      {
        label: 'Chapter III',
        title: 'Ever After',
        body: [
          'The reception moved into the courtyard under the arches. The film closes on the palace windows lighting up one by one.',
        ],
        images: [img(3, 'c')],
      },
    ],
    details: [
      { label: 'Venue', value: 'Lakeside palace, Udaipur' },
      { label: 'Celebrations', value: 'Sangeet · Pheras · Reception' },
      { label: 'Coverage', value: 'Film + editorial photography' },
    ],
    images: imgs(3),
  },
  {
    slug: 'house-of-many-hands',
    index: 3,
    numeral: 'IV',
    theme: 'Joy',
    sanskrit: 'मायोभव्याय चतुष्पदी भव',
    transliteration: 'Mayobhavyaya chatushpadi bhava',
    meaning: 'Take the fourth step, that we may find joy and honour the families who made us.',
    couple: 'Nila & Karthik',
    venue: 'A Chettinad mansion',
    city: 'Karaikudi, Tamil Nadu',
    date: 'January 2026',
    posterTitle: ['House of', 'Many Hands'],
    posterFont: 'dmserif',
    posterTagline: 'Three generations ~under ~one roof ~in ~a ~film ~by Seven+Vow+Stories',
    palette: { paper: '#F4DCCD', ink: '#8A3820', accent: '#C9633E', pageBg: '#76311D', pageInk: '#FBE6DA' },
    heroLine:
      'A HUNDRED HANDS ~in ~a CHETTINAD COURTYARD ~and ~the FOURTH STEP: ~to HONOUR EVERY FAMILY ~that MADE ~us.',
    excerpt:
      'Nila’s family has lived in the same Chettinad mansion for four generations. Every one of them had a job at the wedding, including the great-grandmother who supervised the kolam.',
    acts: [
      {
        label: 'Chapter I',
        title: 'The Vow',
        body: [
          'The fourth step is for joy, and for the families whose joy made yours possible.',
          'In Karaikudi, that meant a mansion of carved teak and Athangudi tiles, and a guest list that was mostly relatives.',
        ],
        images: [img(4, 'a'), img(4, 'c')],
      },
      {
        label: 'Chapter II',
        title: 'The Ceremony',
        body: [
          'Karthik’s turban was tied by his uncle, re-tied by his father, and finally fixed by Nila’s brother. All three are in the film.',
          'Filter coffee was served in clay cups between rituals, and the courtyard never emptied.',
        ],
        images: [img(4, 'poster'), img(4, 'b')],
      },
      {
        label: 'Chapter III',
        title: 'Ever After',
        body: [
          'The last shot is the family portrait: fifty-three people, one courtyard, and a toddler who refused to face the camera.',
        ],
        images: [img(4, 'd')],
      },
    ],
    details: [
      { label: 'Venue', value: 'Chettinad mansion, Karaikudi' },
      { label: 'Celebrations', value: 'Nichayathartham · Muhurtham' },
      { label: 'Coverage', value: 'Film + editorial photography' },
    ],
    images: imgs(4),
  },
  {
    slug: 'little-lanterns',
    index: 4,
    numeral: 'V',
    theme: 'Care',
    sanskrit: 'प्रजाभ्यः पञ्चपदी भव',
    transliteration: 'Prajabhyah panchapadi bhava',
    meaning: 'Take the fifth step, that we may care for all who come after us.',
    couple: 'Isha & Rohan',
    venue: 'The ghats at dusk',
    city: 'Varanasi',
    date: 'March 2026',
    posterTitle: ['Little', 'Lanterns'],
    posterFont: 'gloock',
    posterTagline: 'A thousand lamps ~on ~the river ~in ~a ~film ~by Seven+Vow+Stories',
    palette: { paper: '#DEE2F2', ink: '#22306A', accent: '#E08A2E', pageBg: '#1C285A', pageInk: '#E6E9F7' },
    heroLine:
      'LANTERNS ~on ~the GANGA ~at DUSK ~as ISHA ~and ROHAN TAKE ~the FIFTH STEP: ~to CARE ~for ALL ~who COME ~after ~us.',
    excerpt:
      'Isha and Rohan floated a diya for every child in the family before their pheras. The river carried 41 of them downstream while the aarti began.',
    acts: [
      {
        label: 'Chapter I',
        title: 'The Vow',
        body: [
          'The fifth step looks forward, to children and to everyone your care will reach.',
          'Isha and Rohan began theirs on the river at dawn, in a borrowed boat, with the ghats still waking up.',
        ],
        images: [img(5, 'a'), img(5, 'b')],
      },
      {
        label: 'Chapter II',
        title: 'The Ceremony',
        body: [
          'At dusk the nieces and nephews lit the diyas, one each, and set them on the water.',
          'We filmed by lamplight alone. Nothing in the second act is lit by us.',
        ],
        images: [img(5, 'poster'), img(5, 'c')],
      },
      {
        label: 'Chapter III',
        title: 'Ever After',
        body: [
          'The film closes on a single lamp drifting out of frame, which one of the children insists was hers.',
        ],
        images: [img(5, 'd')],
      },
    ],
    details: [
      { label: 'Venue', value: 'Riverside ghats, Varanasi' },
      { label: 'Celebrations', value: 'Haldi · Pheras · Ganga aarti' },
      { label: 'Coverage', value: 'Film + editorial photography' },
    ],
    images: imgs(5),
  },
  {
    slug: 'every-season-again',
    index: 5,
    numeral: 'VI',
    theme: 'Seasons',
    sanskrit: 'ऋतुभ्यः षट्पदी भव',
    transliteration: 'Ritubhyah shatpadi bhava',
    meaning: 'Take the sixth step, that we may walk through every season side by side.',
    couple: 'Sanya & Neel',
    venue: 'A lake and a snowfield',
    city: 'Srinagar & Gulmarg',
    date: 'December 2025',
    posterTitle: ['Every Season,', 'Again'],
    posterFont: 'poiret',
    posterTagline: 'Snow, spring ~and ~a shikara ~at dawn ~in ~a ~film ~by Seven+Vow+Stories',
    palette: { paper: '#E5EBF1', ink: '#3F5070', accent: '#C88796', pageBg: '#36445E', pageInk: '#EDF1F6' },
    heroLine:
      'SNOW ~in GULMARG, SAFFRON ~in SPRING ~and ~the SIXTH STEP: ~to WALK THROUGH EVERY SEASON, SIDE ~by SIDE.',
    excerpt:
      'A wedding in two seasons: a shikara at dawn on Dal Lake in autumn, then the pheras in Gulmarg after the first heavy snow.',
    acts: [
      {
        label: 'Chapter I',
        title: 'The Vow',
        body: [
          'The sixth step promises every season: the easy ones and the long winters.',
          'Sanya and Neel took that literally and split their wedding between the lake in October and the mountains in December.',
        ],
        images: [img(6, 'poster'), img(6, 'b')],
      },
      {
        label: 'Chapter II',
        title: 'The Ceremony',
        body: [
          'The pheras were held around a fire in a snowfield. Guests wore pherans over their silks, and the priest kept his gloves on.',
          'We shot on long lenses to keep the cold out of our hands and the mountains in the frame.',
        ],
        images: [img(6, 'a'), img(6, 'c')],
      },
      {
        label: 'Chapter III',
        title: 'Ever After',
        body: ['The film ends back on the lake in spring, with one marigold left over from December.'],
        images: [img(6, 'd')],
      },
    ],
    details: [
      { label: 'Venue', value: 'Dal Lake & Gulmarg' },
      { label: 'Celebrations', value: 'Livun · Pheras · Reception' },
      { label: 'Coverage', value: 'Film + editorial photography' },
    ],
    images: imgs(6),
  },
  {
    slug: 'best-friend-forever',
    index: 6,
    numeral: 'VII',
    theme: 'Friendship',
    sanskrit: 'सखे सप्तपदी भव',
    transliteration: 'Sakhe saptapadi bhava',
    meaning: 'Take the seventh step, and be my friend for life.',
    couple: 'Riya & Dev',
    venue: 'A beach at sunrise',
    city: 'North Goa',
    date: 'April 2026',
    posterTitle: ['Best Friend,', 'Forever'],
    posterFont: 'cormorant',
    posterTagline: 'Best friends ~since school ~in ~a ~film ~by Seven+Vow+Stories',
    palette: { paper: '#FAE0DC', ink: '#9E3838', accent: '#EE7866', pageBg: '#873131', pageInk: '#FDEBE7' },
    heroLine:
      'BAREFOOT ~on ~a GOA SHORE, BEST FRIENDS ~since SCHOOL TAKE ~the SEVENTH STEP: ~to STAY FRIENDS, FOREVER.',
    excerpt:
      'Riya and Dev met in the second grade and have argued about cricket ever since. They took the last vow barefoot, at sunrise, with their school friends as the wedding party.',
    acts: [
      {
        label: 'Chapter I',
        title: 'The Vow',
        body: [
          'The seventh step is the last and maybe the hardest: to be friends, for life.',
          'Riya and Dev had a head start of twenty-two years. Their wedding party was their old school bench, reunited in Goa.',
        ],
        images: [img(7, 'a'), img(7, 'c')],
      },
      {
        label: 'Chapter II',
        title: 'The Ceremony',
        body: [
          'A mandap of driftwood and bougainvillea, pheras on the sand, and the tide politely staying out until the seventh step.',
          'Then everyone ran into the sea, which we had been warned about and filmed anyway.',
        ],
        images: [img(7, 'poster'), img(7, 'b')],
      },
      {
        label: 'Chapter III',
        title: 'Ever After',
        body: ['The film ends at the fishing jetty at dawn the next day, two friends and two coffees.'],
        images: [img(7, 'd')],
      },
    ],
    details: [
      { label: 'Venue', value: 'Beach mandap, North Goa' },
      { label: 'Celebrations', value: 'Mehendi · Sangeet · Pheras' },
      { label: 'Coverage', value: 'Film + editorial photography' },
    ],
    images: imgs(7),
  },
];

export const posterSrc = (s: Story) => `/posters/vow-${s.index + 1}.webp`;
export const posterBackSrc = (s: Story) => `/posters/back-${s.index + 1}.webp`;
export const filmSrc = (s: Story) => `/films/vow-${s.index + 1}.mp4`;
export const filmPreviewSrc = (s: Story) => `/films/vow-${s.index + 1}-preview.mp4`;
export const filmStillSrc = (s: Story) => `/films/vow-${s.index + 1}.webp`;

export function storyBySlug(slug: string) {
  return stories.find((s) => s.slug === slug);
}

/** Parse a hero line into words with a size flag (~ = small, + = non-breaking space). */
export function parseLine(line: string) {
  return line
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      const small = raw.startsWith('~');
      // + joins words that must stay on one line (the brand name).
      return { w: (small ? raw.slice(1) : raw).replace(/\+/g, ' '), small };
    });
}
