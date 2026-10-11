import { Resume } from '../types/resume';
import { RenderOptions, ResumeTemplate } from './types';

import { classicTemplate } from './classic';
import { compactTemplate } from './compact';
import { minimalTemplate } from './minimal';
import { formalTemplate } from './formal';
import { stackedTemplate } from './stacked';
import { bannerTemplate } from './banner';
import { executiveTemplate } from './executive';
import { technicalTemplate } from './technical';
import { academicTemplate } from './academic';
import { gridTemplate } from './grid';
import { timelineTemplate } from './timeline';
import { cardsTemplate } from './cards';
import { swissTemplate } from './swiss';
import { editorialTemplate } from './editorial';
import { accentBarTemplate } from './accentbar';
import { sidebarTemplate, sidebarRightTemplate } from './sidebar';
import { duotoneTemplate } from './duotone';
import { monoTemplate } from './mono';
import { outlineTemplate } from './outline';
import { centeredTemplate } from './centered';
import { serifRailTemplate } from './serifrail';
import { ruledTemplate } from './ruled';
import { splitHeadTemplate } from './splithead';
import { capsuleTemplate } from './capsule';
import { spotlightTemplate } from './spotlight';
import { edgeMarkTemplate } from './edgemark';
import { condensedTemplate } from './condensed';
import { gradientHeadTemplate } from './gradienthead';
import { slateTemplate } from './slate';
import { notebookTemplate } from './notebook';
import { familyTemplates } from './families/catalog';

/**
 * Gallery order. Free designs lead, then parser-safe premium ones, then the
 * two-column designs last — they look the best in a thumbnail and are the
 * worst choice for most applications, so they should not be the first thing
 * a user sees.
 */
const HAND_BUILT: ResumeTemplate[] = [
  classicTemplate,
  stackedTemplate,
  minimalTemplate,
  compactTemplate,
  formalTemplate,

  editorialTemplate,
  swissTemplate,
  executiveTemplate,
  splitHeadTemplate,
  gridTemplate,
  notebookTemplate,
  timelineTemplate,
  serifRailTemplate,
  centeredTemplate,
  technicalTemplate,
  monoTemplate,
  academicTemplate,
  ruledTemplate,
  condensedTemplate,
  outlineTemplate,
  spotlightTemplate,
  edgeMarkTemplate,
  bannerTemplate,
  gradientHeadTemplate,
  slateTemplate,
  accentBarTemplate,
  capsuleTemplate,
  cardsTemplate,

  sidebarTemplate,
  sidebarRightTemplate,
  duotoneTemplate,
];

/**
 * The hand-built designs lead the gallery. They are the five free ones plus
 * the premium designs that were drawn one at a time, and they are the ones a
 * new user should meet first; the generated catalogue follows, already
 * ordered so neighbours never share a layout or a typeface.
 */
const TEMPLATES: ResumeTemplate[] = [...HAND_BUILT, ...familyTemplates()];

const BY_ID = new Map(TEMPLATES.map(t => [t.id, t]));

export const FALLBACK_TEMPLATE_ID = 'classic';

export function allTemplates(): ResumeTemplate[] {
  return TEMPLATES;
}

export function freeTemplates(): ResumeTemplate[] {
  return TEMPLATES.filter(t => t.tier === 'free');
}

export function getTemplate(id: string): ResumeTemplate {
  return BY_ID.get(id) ?? BY_ID.get(FALLBACK_TEMPLATE_ID)!;
}

/**
 * Preview is never gated — users must see a premium design before paying.
 * Gating happens at export only, in services/exportResume.
 */
export function renderResume(resume: Resume, opts: RenderOptions): string {
  return getTemplate(resume.templateId).render(resume, opts);
}
