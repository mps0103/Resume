import { esc } from '../base';
import { makeTemplate } from '../makeTemplate';
import { ResumeTemplate } from '../types';
import { LAYOUTS, Layout } from './layouts';
import { SKINS, Skin, skinCss } from './skins';

/**
 * The generated half of the catalogue.
 *
 * Every design here is one structural layout paired with one typographic
 * skin. That is not a shortcut for shipping a big number: the two halves are
 * genuinely independent, so a pairing changes both the shape of the page and
 * its voice, and no two of these read as the same design recoloured.
 *
 * All of them are premium. The free tier stays at the five hand-built
 * designs, which is what the paywall copy and the inventory test both assume.
 */

const LAYOUT_ORDER = [
  'rail', 'band', 'numbered', 'hairline', 'display', 'boxed', 'timeline',
  'panel', 'tab', 'ruleRight', 'centered', 'split', 'cardEntry', 'strip',
] as const;

const SKIN_ORDER = ['grotesk', 'editorial', 'mono', 'press', 'soft'] as const;

type LayoutId = (typeof LAYOUT_ORDER)[number];
type SkinId = (typeof SKIN_ORDER)[number];

/**
 * Names, laid out as the grid they actually are. Order within each row
 * follows SKIN_ORDER.
 */
const NAMES: Record<LayoutId, [string, string, string, string, string]> = {
  rail:      ['Meridian', 'Ledger', 'Console', 'Gazette', 'Lumen'],
  band:      ['Cobalt', 'Imprint', 'Terminal', 'Headline', 'Lagoon'],
  numbered:  ['Index', 'Chapter', 'Sequence', 'Bulletin', 'Cadence'],
  hairline:  ['Filament', 'Folio', 'Circuit', 'Broadsheet', 'Drift'],
  display:   ['Poster', 'Manuscript', 'Monolith', 'Marquee', 'Halo'],
  boxed:     ['Carton', 'Almanac', 'Module', 'Dossier', 'Pebble'],
  timeline:  ['Milestone', 'Chronicle', 'Trace', 'Dispatch', 'Current'],
  panel:     ['Atlas', 'Quarto', 'Sidecar', 'Column', 'Harbour'],
  tab:       ['Pill', 'Bookmark', 'Token', 'Tagline', 'Bloom'],
  ruleRight: ['Horizon', 'Colophon', 'Prompt', 'Masthead', 'Reach'],
  centered:  ['Axis', 'Sonnet', 'Centreline', 'Playbill', 'Orbit'],
  split:     ['Balance', 'Broadside', 'Divide', 'Standard', 'Mirror'],
  cardEntry: ['Placard', 'Codex', 'Snippet', 'Clipping', 'Tile'],
  strip:     ['Ribbon', 'Dateline', 'Datastrip', 'Tabloid', 'Meadow'],
};

const LAYOUT_BLURB: Record<LayoutId, string> = {
  rail: 'Section headings in their own left column.',
  band: 'Name and contact details inside a filled card.',
  numbered: 'Sections counted 01, 02, 03 down the page.',
  hairline: 'A hairline rule across the measure above every heading.',
  display: 'An oversized name over deliberately quiet body copy.',
  boxed: 'Every section inside its own outlined card.',
  timeline: 'A ruled spine with a dot marking each entry.',
  panel: 'Two columns, with contact and skills in a tinted aside.',
  tab: 'Headings set as filled pills.',
  ruleRight: 'A rule running from each heading out to the margin.',
  centered: 'Everything centred on the measure.',
  split: 'Name hard left, contact details hard right.',
  cardEntry: 'Each role set as a card with an accent edge.',
  strip: 'Contact details pulled into a tinted strip under the name.',
};

const SKIN_BLURB: Record<SkinId, string> = {
  grotesk: 'Neutral modern sans.',
  editorial: 'Book-weight serif, sentence-case headings.',
  mono: 'Monospaced throughout.',
  press: 'Narrow grotesque that fits more on a page.',
  soft: 'Wide leading, nothing shouted.',
};

/**
 * Accent suggestions. Muted enough to survive a monochrome office printer,
 * which is still where a great many resumes end up.
 */
const PALETTE = [
  '#1F3A5F', '#0F172A', '#1D4ED8', '#0E7490', '#115E59',
  '#3F6212', '#B45309', '#9D174D', '#4C1D95', '#7C2D12',
  '#374151', '#065F46', '#7E22CE', '#BE123C', '#155E75',
];

function accentsFor(index: number): string[] {
  const n = PALETTE.length;
  // Three distinct swatches, spread across the palette rather than adjacent,
  // so the alternatives in the Style screen actually look like alternatives.
  return [
    PALETTE[index % n],
    PALETTE[(index * 7 + 4) % n],
    PALETTE[(index * 11 + 9) % n],
  ];
}

function familyTemplate(
  id: string,
  name: string,
  blurb: string,
  layout: Layout,
  skin: Skin,
  accents: string[],
): ResumeTemplate {
  return makeTemplate({
    id,
    name,
    blurb,
    tier: 'premium',
    atsSafe: layout.atsSafe,
    onePageOnly: layout.onePageOnly,
    accents,
    css: r => {
      const ctx = { skin, a: esc(r.style.accent), d: r.style.density };
      // Skin first: the layout is allowed to override the type it sets, and
      // never the other way round.
      return skinCss(ctx) + layout.css(ctx);
    },
    body: r => layout.body(r, skin),
  });
}

/**
 * 14 layouts and 5 skins, walked with a single counter.
 *
 * 14 and 5 are coprime, so stepping both indices by one each time visits all
 * 70 pairings exactly once before repeating. That is not a trick for its own
 * sake — it means neighbours in the gallery never share a layout OR a skin,
 * so scrolling shows real variety instead of five near-identical rows.
 */
export function familyTemplates(): ResumeTemplate[] {
  const total = LAYOUT_ORDER.length * SKIN_ORDER.length;
  const out: ResumeTemplate[] = [];

  for (let i = 0; i < total; i++) {
    const layoutId = LAYOUT_ORDER[i % LAYOUT_ORDER.length];
    const skinId = SKIN_ORDER[i % SKIN_ORDER.length];
    const skinIndex = SKIN_ORDER.indexOf(skinId);

    out.push(
      familyTemplate(
        `${layoutId.toLowerCase()}-${skinId}`,
        NAMES[layoutId][skinIndex],
        `${LAYOUT_BLURB[layoutId]} ${SKIN_BLURB[skinId]}`,
        LAYOUTS[layoutId],
        SKINS[skinId],
        accentsFor(i),
      ),
    );
  }

  return out;
}
