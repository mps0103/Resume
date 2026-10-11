import { Resume, Section, SectionType } from '../types/resume';
import { dateRange, esc, formatDay, formatMonth, visibleSections } from './base';

/**
 * Stable markup shared by every template. Class names here are a contract:
 * templates style them, they do not re-emit them. Changing a class name is
 * a breaking change across fifteen stylesheets, so add rather than rename.
 */

export interface EntryData {
  title: string;
  dates: string;
  sub: string;
  bullets: string[];
}

/** Joins present parts with a separator, skipping blanks so no empty gaps. */
export function join(parts: (string | undefined)[], sep = ' \u00b7 '): string {
  return parts.filter(p => p && p.trim()).join(sep);
}

/** Normalises any section item into the shape templates actually render. */
export function toEntries(section: Section): EntryData[] {
  switch (section.type) {
    case 'experience':
      return section.items.map(i => ({
        title: i.role,
        dates: dateRange(i.startDate, i.endDate, i.current),
        sub: join([i.company, i.location]),
        bullets: i.bullets,
      }));
    case 'education':
      return section.items.map(i => ({
        title: i.degree,
        dates: dateRange(i.startDate, i.endDate, i.current),
        sub: join([i.institution, i.location, i.score]),
        bullets: i.bullets,
      }));
    case 'projects':
      return section.items.map(i => ({
        title: i.name,
        dates: dateRange(i.startDate, i.endDate, i.current),
        sub: join([i.role, i.url]),
        bullets: i.bullets,
      }));
    case 'certifications':
      return section.items.map(i => ({
        title: i.name,
        dates: formatMonth(i.date),
        sub: join([i.issuer, i.url]),
        bullets: [],
      }));
    case 'custom':
      return section.items.map(i => ({
        title: i.title,
        dates: dateRange(i.startDate, i.endDate, i.current),
        sub: i.subtitle,
        bullets: i.bullets,
      }));
    default:
      return [];
  }
}

export function bulletsHtml(items: string[]): string {
  const kept = items.filter(b => b.trim());
  if (!kept.length) return '';
  return `<ul class="bullets">${kept
    .map(b => `<li>${esc(b)}</li>`)
    .join('')}</ul>`;
}

/** Title and dates on one line, subtitle beneath. The common case. */
export function entryHtml(e: EntryData): string {
  return `<div class="entry">
    <div class="entry-head">
      <div class="entry-title">${esc(e.title)}</div>
      ${e.dates ? `<div class="entry-dates">${esc(e.dates)}</div>` : ''}
    </div>
    ${e.sub.trim() ? `<div class="entry-sub">${esc(e.sub)}</div>` : ''}
    ${bulletsHtml(e.bullets)}
  </div>`;
}

/** Dates in their own left rail. Used by grid and timeline layouts. */
export function entryRailHtml(e: EntryData): string {
  return `<div class="entry entry-rail">
    <div class="rail">${esc(e.dates)}</div>
    <div class="rail-body">
      <div class="entry-title">${esc(e.title)}</div>
      ${e.sub.trim() ? `<div class="entry-sub">${esc(e.sub)}</div>` : ''}
      ${bulletsHtml(e.bullets)}
    </div>
  </div>`;
}

/** Everything stacked, dates last. Used by centred and compact layouts. */
export function entryStackHtml(e: EntryData): string {
  return `<div class="entry entry-stack">
    <div class="entry-title">${esc(e.title)}</div>
    <div class="entry-meta">${esc(join([e.sub, e.dates]))}</div>
    ${bulletsHtml(e.bullets)}
  </div>`;
}

export function skillsHtml(section: Section, style: 'rows' | 'chips' | 'inline'): string {
  if (section.type !== 'skills') return '';
  const rows = section.items
    .map(i => ({ group: i.group, values: i.values.filter(v => v.trim()) }))
    .filter(r => r.values.length);
  if (!rows.length) return '';

  if (style === 'chips') {
    return `<div class="chip-row">${rows
      .flatMap(r => r.values)
      .map(v => `<span class="chip">${esc(v)}</span>`)
      .join('')}</div>`;
  }
  if (style === 'inline') {
    return `<p class="skills-inline">${esc(
      rows.flatMap(r => r.values).join(' \u00b7 '),
    )}</p>`;
  }
  const grouped = rows.some(r => r.group.trim());
  return rows
    .map(
      r => `<div class="skill-row">
        ${grouped ? `<div class="skill-group">${esc(r.group)}</div>` : ''}
        <div class="skill-values">${esc(r.values.join(', '))}</div>
      </div>`,
    )
    .join('');
}

export function languagesHtml(section: Section): string {
  if (section.type !== 'languages') return '';
  return `<div class="lang-grid">${section.items
    .map(
      i =>
        `<div class="lang"><span class="lang-name">${esc(i.name)}</span>${
          i.proficiency ? `<span class="lang-level">${esc(i.proficiency)}</span>` : ''
        }</div>`,
    )
    .join('')}</div>`;
}

export type EntryStyle = 'head' | 'rail' | 'stack';

export function sectionBodyHtml(section: Section, entryStyle: EntryStyle, skillStyle: 'rows' | 'chips' | 'inline'): string {
  if (section.type === 'skills') return skillsHtml(section, skillStyle);
  if (section.type === 'languages') return languagesHtml(section);
  const render =
    entryStyle === 'rail' ? entryRailHtml : entryStyle === 'stack' ? entryStackHtml : entryHtml;
  return toEntries(section).map(render).join('');
}

export interface SectionsOptions {
  entryStyle: EntryStyle;
  skillStyle: 'rows' | 'chips' | 'inline';
  /** Only render these types. Omit for all. */
  only?: SectionType[];
  /** Render everything except these types. */
  except?: SectionType[];
  /** Wraps each heading, e.g. to add a rule or a marker span. */
  heading?: (title: string) => string;
  /**
   * Wraps the section's entries in a div with this class. Required whenever
   * the template makes .section a flex or grid container — without it every
   * entry becomes a sibling track and the entries lay out side by side.
   */
  bodyClass?: string;
}

export function sectionsHtml(resume: Resume, opts: SectionsOptions): string {
  return visibleSections(resume)
    .filter(s => (opts.only ? opts.only.includes(s.type) : true))
    .filter(s => (opts.except ? !opts.except.includes(s.type) : true))
    .map(section => {
      const inner = sectionBodyHtml(section, opts.entryStyle, opts.skillStyle);
      if (!inner.trim()) return '';
      const h = opts.heading
        ? opts.heading(esc(section.title))
        : `<h2>${esc(section.title)}</h2>`;
      const body = opts.bodyClass
        ? `<div class="${opts.bodyClass}">${inner}</div>`
        : inner;
      return `<section class="section">${h}${body}</section>`;
    })
    .join('');
}

/**
 * The closing declaration, signature and date.
 *
 * Emitted by makeTemplate after the template's own body rather than by each
 * template, so all of them gain it at once and none can lose it. It is given
 * the .section class deliberately: that is what makes the heading inherit the
 * design's own heading style instead of looking like a different document.
 *
 * Returns '' unless there is genuinely something to show, so a user who
 * clears the text does not get a bare "Declaration" heading over nothing.
 */
export function declarationHtml(resume: Resume): string {
  const d = resume.declaration;
  if (!d || !d.enabled) return '';

  const text = d.text.trim();
  const name = d.signatureName.trim() || resume.basics.fullName.trim();
  const place = d.place.trim();
  const date = formatDay(d.date);

  const meta = [
    place ? `<div>Place: ${esc(place)}</div>` : '',
    date ? `<div>Date: ${date}</div>` : '',
  ].join('');

  const sign = [
    d.showSignatureLine ? '<div class="sig-line"></div>' : '',
    name ? `<div class="sig-name">${esc(name)}</div>` : '',
    // Labels the rule only when there is no name to label it, so a signed
    // copy does not carry a redundant caption under the applicant's own
    // name. With no rule drawn there is nothing to caption either, and a
    // lone "Signature" under an empty heading is not worth a block.
    !name && d.showSignatureLine ? '<div class="sig-caption">Signature</div>' : '',
  ].join('');

  const close =
    meta || sign
      ? `<div class="decl-close"><div class="decl-meta">${meta}</div><div class="decl-sign">${sign}</div></div>`
      : '';

  if (!text && !close) return '';

  return `<section class="section declaration">
    <h2>Declaration</h2>
    ${text ? `<p class="decl-text">${esc(text)}</p>` : ''}
    ${close}
  </section>`;
}

/** True when the resume has anything at all for these section types. */
export function hasAny(resume: Resume, types: SectionType[]): boolean {
  return visibleSections(resume).some(s => types.includes(s.type));
}

export function contactItems(resume: Resume): string[] {
  const b = resume.basics;
  return [b.email, b.phone, b.location, ...b.links.map(l => l.label)].filter(
    v => v && v.trim(),
  );
}

export function contactHtml(resume: Resume, cls = 'contact'): string {
  const items = contactItems(resume);
  if (!items.length) return '';
  return `<div class="${cls}">${items
    .map(v => `<span>${esc(v)}</span>`)
    .join('')}</div>`;
}

export function contactStackHtml(resume: Resume): string {
  const items = contactItems(resume);
  if (!items.length) return '';
  return `<div class="contact-stack">${items
    .map(v => `<div>${esc(v)}</div>`)
    .join('')}</div>`;
}
