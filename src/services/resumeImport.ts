import {
  Basics,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
  Resume,
  Section,
  SectionType,
  SkillItem,
} from '../types/resume';
import { createResume, emptySection, uid } from '../data/factory';

/**
 * Turns the plain text of an existing resume into an editable document.
 *
 * The pipeline is the conventional one commercial parsers use, and the
 * stages are deliberately separate so each can be tested on its own:
 *
 *   1. normalise    — strip the debris PDF and Word text extraction leaves
 *   2. segment      — split into sections by recognising their headings
 *   3. extract      — pull typed fields out of each section's lines
 *   4. assemble     — build a Resume the editor can open
 *
 * It is explicitly a FIRST DRAFT, not a conversion. Real resumes are laid
 * out for human eyes, and once a two-column design has been flattened to
 * text there is frequently no way to tell a job title from a company name.
 * So this errs towards keeping the user's words — a line it cannot classify
 * becomes a bullet rather than being dropped — and the user lands in the
 * editor to fix it. Losing someone's text is far worse than misfiling it.
 */

export interface ImportStats {
  /** Section types that were recognised and populated. */
  sections: SectionType[];
  entries: number;
  foundName: boolean;
  foundEmail: boolean;
  foundPhone: boolean;
}

export interface ImportResult {
  resume: Resume;
  stats: ImportStats;
}

/* -------------------------------------------------------------- normalise */

/**
 * PDF and Word extraction both leave debris that breaks every later stage:
 * non-breaking spaces that defeat trimming, Windows line endings, soft
 * hyphens, zero-width characters, and the bullet glyphs each template picks.
 */
/**
 * Page numbers, running headers and export watermarks.
 *
 * PDF extraction returns these inline with the content, so without this a
 * footer becomes an education entry — a real import of this app's own
 * export produced a degree called "Made with Resume Builder by MPS" from
 * the page 2 watermark.
 */
const PAGE_FURNITURE =
  /^(?:page\s*\d+(?:\s*(?:of|\/)\s*\d+)?|\d{1,3}|made with resume builder.*)$/i;

export function normaliseText(raw: string): string[] {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[   ]/g, ' ')
    .replace(/[​-‍﻿­]/g, '')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => !PAGE_FURNITURE.test(line))
    .filter((line, i, all) => line !== '' || all[i - 1] !== '');
}

/**
 * Re-joins a sentence that the page width broke in two.
 *
 * Extracted text is wrapped at whatever width the document was laid out
 * to, so a single bullet routinely arrives as two or three lines. Left
 * alone, every one of those continuations looks like the start of a new
 * entry — on a real export of this app's own resume it turned three jobs
 * into four and two projects into three, with half a sentence standing in
 * as the job title.
 *
 * The test for a continuation is the one typography gives us: the previous
 * line ran to the margin and did not finish a sentence, and this one opens
 * in lower case.
 */
export function unwrapLines(lines: string[]): string[] {
  const out: string[] = [];

  for (const line of lines) {
    const prev = out[out.length - 1];
    const continues =
      !!prev &&
      prev.length > 40 &&
      line !== '' &&
      !isBullet(line) &&
      !headingType(line) &&
      !findDateRange(line) &&
      !/[.;:!?]$/.test(prev) &&
      /^[a-z(]/.test(line) &&
      // A link or an address opens in lower case too, and joining one onto
      // the contact line above it buries the location inside a URL.
      !EMAIL.test(line) &&
      !URL.test(line);

    if (continues) out[out.length - 1] = prev + ' ' + line;
    else out.push(line);
  }

  return out;
}

const BULLET_MARKERS = /^[•●▪◦‣⁃·*∙+\-–—]\s+/;

export function isBullet(line: string): boolean {
  return BULLET_MARKERS.test(line);
}

export function stripBullet(line: string): string {
  return line.replace(BULLET_MARKERS, '').trim();
}

/* ---------------------------------------------------------------- segment */

/**
 * Heading synonyms, which is the whole game in section detection.
 *
 * "Work Experience", "Employment History", "Professional Background" and
 * "Career Summary" are the same section to a human and four different
 * strings to a program. Longest match wins, so "Technical Skills" is not
 * mistaken for a generic "Skills" heading placed elsewhere.
 */
const HEADINGS: { type: SectionType | 'summary'; words: string[] }[] = [
  {
    type: 'experience',
    words: [
      'work experience', 'professional experience', 'employment history',
      'work history', 'career history', 'professional background',
      'employment', 'experience',
    ],
  },
  {
    type: 'education',
    words: [
      'educational qualifications', 'academic qualifications',
      'academic background', 'education and training', 'qualifications',
      'academics', 'academic', 'education',
    ],
  },
  {
    type: 'skills',
    words: [
      'technical skills', 'core competencies', 'key skills',
      'areas of expertise', 'skills and abilities', 'competencies',
      'technologies', 'tech stack', 'expertise', 'skills',
    ],
  },
  {
    type: 'projects',
    words: [
      'academic projects', 'personal projects', 'key projects',
      'project work', 'projects',
    ],
  },
  {
    type: 'certifications',
    words: [
      'certifications and licenses', 'licenses and certifications',
      'courses and certifications', 'certifications', 'certificates',
      'certification', 'licenses', 'courses', 'training',
    ],
  },
  {
    type: 'languages',
    words: ['language proficiency', 'languages known', 'languages'],
  },
  {
    type: 'summary',
    words: [
      'professional summary', 'career objective', 'career summary',
      'personal profile', 'about me', 'objective', 'summary', 'profile',
      'about',
    ],
  },
];

/** A heading is short, and matches a known name once punctuation is gone. */
export function headingType(line: string): SectionType | 'summary' | null {
  const cleaned = line
    .toLowerCase()
    .replace(/[:•|_\-–—]+/g, ' ')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length > 42) return null;

  for (const { type, words } of HEADINGS) {
    for (const word of words) {
      if (cleaned === word) return type;
    }
  }
  return null;
}

export interface Block {
  type: SectionType | 'summary' | 'header';
  lines: string[];
}

/**
 * Splits the document at its headings. Everything before the first
 * recognised heading is the header block — where the name and contact
 * details almost always live.
 */
export function segment(lines: string[]): Block[] {
  const blocks: Block[] = [{ type: 'header', lines: [] }];

  for (const line of lines) {
    const type = headingType(line);
    if (type) {
      blocks.push({ type, lines: [] });
    } else {
      blocks[blocks.length - 1].lines.push(line);
    }
  }

  return blocks.filter(b => b.lines.length > 0 || b.type !== 'header');
}

/* ----------------------------------------------------------------- dates */

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

const MONTH_NAMES = Object.keys(MONTHS).join('|');
const PRESENT = /\b(present|current|now|till date|to date|ongoing)\b/i;

/** 'Mar 2024', '03/2024', '2024' -> 'YYYY-MM'. Bare years become January. */
function toYearMonth(token: string): string {
  const named = new RegExp(`\\b(${MONTH_NAMES})\\.?\\s*,?\\s*(\\d{4})\\b`, 'i').exec(token);
  if (named) {
    const month = MONTHS[named[1].toLowerCase()];
    return `${named[2]}-${String(month).padStart(2, '0')}`;
  }

  const numeric = /\b(\d{1,2})[/.-](\d{4})\b/.exec(token);
  if (numeric) {
    const month = Math.min(12, Math.max(1, parseInt(numeric[1], 10)));
    return `${numeric[2]}-${String(month).padStart(2, '0')}`;
  }

  const year = /\b(19|20)\d{2}\b/.exec(token);
  if (year) return `${year[0]}-01`;

  return '';
}

export interface DateRange {
  startDate: string;
  endDate: string;
  current: boolean;
  /** The matched text, so the caller can remove it from the line. */
  matched: string;
}

const DATE_TOKEN = `(?:(?:${MONTH_NAMES})\\.?\\s*,?\\s*\\d{4}|\\d{1,2}[/.-]\\d{4}|(?:19|20)\\d{2})`;
const SEPARATOR = `\\s*(?:[-–—]|to|until|till)\\s*`;

/**
 * Finds a date range anywhere in a line.
 *
 * A range is what marks the start of an entry, so this is the single most
 * load-bearing piece of the parser. It must not fire on a bare year sitting
 * inside prose — "reduced load times by 2024ms" — so a lone year only
 * counts when the line is short enough to be a heading rather than a
 * sentence.
 */
export function findDateRange(line: string): DateRange | null {
  const ranged = new RegExp(`(${DATE_TOKEN})${SEPARATOR}(${DATE_TOKEN}|${PRESENT.source})`, 'i');
  const match = ranged.exec(line);
  if (match) {
    const endRaw = match[2];
    const current = PRESENT.test(endRaw);
    return {
      startDate: toYearMonth(match[1]),
      endDate: current ? '' : toYearMonth(endRaw),
      current,
      matched: match[0],
    };
  }

  // An open-ended range: "Since March 2021", "Mar 2021 – Present".
  const open = new RegExp(`(${DATE_TOKEN})${SEPARATOR}?\\s*(?:${PRESENT.source})`, 'i').exec(line);
  if (open) {
    return {
      startDate: toYearMonth(open[1]),
      endDate: '',
      current: true,
      matched: open[0],
    };
  }

  // A single date, only on a line short enough to be an entry heading, and
  // only when it names a month. A bare year on its own is far more often
  // part of a sentence than the date of an entry.
  if (line.length <= 90) {
    const single = new RegExp(DATE_TOKEN, 'i').exec(line);
    const named =
      !!single &&
      (new RegExp(`(?:${MONTH_NAMES})`, 'i').test(single[0]) ||
        /\d{1,2}[/.-]\d{4}/.test(single[0]));
    if (single && named) {
      const value = toYearMonth(single[0]);
      if (value) {
        return { startDate: value, endDate: '', current: false, matched: single[0] };
      }
    }
  }

  return null;
}

/** Removes the date text and any separator debris it leaves behind. */
function withoutDates(line: string, matched: string): string {
  return line
    .replace(matched, ' ')
    .replace(/\s*[|·•,–—-]\s*$/, '')
    .replace(/^\s*[|·•,–—-]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* --------------------------------------------------------------- contact */

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
/** Deliberately strict: loose phone patterns match years and postcodes. */
const PHONE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,5}[\s.-]?\d{3,4}[\s.-]?\d{0,4}/;
const URL = /(?:https?:\/\/|www\.)[^\s,;|]+|(?:linkedin\.com|github\.com|gitlab\.com|behance\.net|dribbble\.com)\/[^\s,;|]+/i;

function looksLikePhone(candidate: string): boolean {
  const digits = candidate.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

export function extractContact(lines: string[]): Partial<Basics> {
  const basics: Partial<Basics> = {};
  const links: Basics['links'] = [];

  for (const line of lines) {
    if (!basics.email) {
      const email = EMAIL.exec(line);
      if (email) basics.email = email[0];
    }

    if (!basics.phone) {
      // Strip anything already claimed, so an email's digits cannot be read
      // as a telephone number.
      const stripped = line.replace(EMAIL, ' ').replace(URL, ' ');
      const phone = PHONE.exec(stripped);
      if (phone && looksLikePhone(phone[0])) basics.phone = phone[0].trim();
    }

    const url = URL.exec(line);
    if (url && links.length < 4) {
      const value = url[0].replace(/[.,;)]+$/, '');
      if (!links.some(l => l.url === value)) {
        links.push({ id: uid(), label: value.replace(/^https?:\/\//, ''), url: value });
      }
    }
  }

  if (links.length) basics.links = links;

  const location = findLocation(lines);
  if (location) basics.location = location;

  return basics;
}

/**
 * "Bengaluru, India" or "Remote". Only taken from a short line that holds
 * nothing else, because any longer line with a comma is far more likely to
 * be a sentence.
 */
function findLocation(lines: string[]): string {
  const PLACE = /^[A-Z][\w.'-]+(?:\s[\w.'-]+)*,\s*[A-Z][\w.'-]+(?:\s[\w.'-]+)*$/;

  for (const line of lines) {
    // Contact details are usually crammed onto one line separated by pipes
    // or dots, so each segment is tested as well as the whole line.
    for (const part of line.split(/\s*[|·•]\s*/)) {
      const candidate = part.trim();
      if (!candidate || candidate.length > 48) continue;
      if (EMAIL.test(candidate) || URL.test(candidate)) continue;
      if (/^remote$/i.test(candidate)) return candidate;
      if (PLACE.test(candidate)) return candidate;
    }

    // Contact lines are often just space separated. Take out everything
    // already identified — email, links, telephone — and whatever short
    // remainder is left is the location.
    const residue = line
      .replace(new RegExp(EMAIL.source, 'gi'), ' ')
      .replace(new RegExp(URL.source, 'gi'), ' ')
      .replace(new RegExp(PHONE.source, 'g'), ' ')
      // The separators the removed parts were sitting between.
      .replace(/[|·•]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (residue && residue.length <= 48) {
      if (/^remote$/i.test(residue) || PLACE.test(residue)) return residue;
    }
  }
  return '';
}

/**
 * The name is the first line that reads like one.
 *
 * Almost every resume opens with it, so position does most of the work; the
 * rest is ruling out the contact details that often share those lines.
 */
export function extractName(lines: string[]): string {
  for (const line of lines.slice(0, 6)) {
    if (!line || line.length > 46) continue;
    if (EMAIL.test(line) || URL.test(line)) continue;
    if (/\d/.test(line)) continue;
    if (headingType(line)) continue;
    const words = line.split(/\s+/);
    if (words.length < 1 || words.length > 5) continue;
    // A line of lower-case prose is a tagline, not a name.
    if (line === line.toLowerCase()) continue;
    return line.replace(/[,|•·]+$/, '').trim();
  }
  return '';
}

/* --------------------------------------------------------------- entries */

interface RawEntry {
  title: string;
  sub: string;
  range: DateRange | null;
  bullets: string[];
}

/**
 * Groups a section's lines into entries.
 *
 * The rule, which is what the layout conventions actually encode: a date
 * range marks an entry. Lines before it that are not bullets are its title
 * and subtitle; bullets after it belong to it, until the next range.
 *
 * A line that cannot be placed becomes a bullet rather than being dropped.
 */
export function groupEntries(lines: string[]): RawEntry[] {
  const entries: RawEntry[] = [];
  let pending: string[] = [];
  let current: RawEntry | null = null;

  const flush = () => {
    if (current) entries.push(current);
    current = null;
  };

  for (const line of lines) {
    // A blank line separates entries; it is never content. Letting it fall
    // through made it the pending title of the next entry, which pushed the
    // real title into the subtitle and the company into the job title.
    if (!line) {
      if (current && current.bullets.length > 0) flush();
      continue;
    }

    if (isBullet(line)) {
      const text = stripBullet(line);
      if (!text) continue;
      if (!current) {
        // Bullets before any dated heading: open an entry from whatever
        // unplaced lines came before them.
        current = {
          title: pending[0] ?? '',
          sub: pending.slice(1).join(' · '),
          range: null,
          bullets: [],
        };
        pending = [];
      }
      current.bullets.push(text);
      continue;
    }

    const range = findDateRange(line);
    if (range) {
      flush();
      const rest = withoutDates(line, range.matched);
      const parts = [...pending, ...(rest ? [rest] : [])];
      current = {
        title: parts[0] ?? '',
        sub: parts.slice(1).join(' · '),
        range,
        bullets: [],
      };
      pending = [];
      continue;
    }

    // A plain line, once the entry already has content.
    //
    // Plenty of resumes mark no bullets at all — each achievement is simply
    // its own paragraph — so "a line after the bullets" cannot by itself
    // mean a new entry. Length and punctuation separate the two: a finished
    // sentence is another achievement, while something short and unpunctuated
    // is the next job title.
    if (current && current.bullets.length > 0) {
      if (line.length > 60 || /[.!?]$/.test(line)) {
        current.bullets.push(line);
      } else {
        flush();
        pending = [line];
      }
    } else if (current && !current.sub) {
      current.sub = line;
    } else if (current) {
      current.bullets.push(line);
    } else {
      pending.push(line);
    }
  }

  flush();

  // Trailing unplaced lines still represent something the user wrote.
  if (pending.length) {
    entries.push({
      title: pending[0],
      sub: pending.slice(1).join(' · '),
      range: null,
      bullets: [],
    });
  }

  return entries.filter(e => e.title || e.bullets.length);
}

/** "Acme Corp · Remote" -> ['Acme Corp', 'Remote'] */
function splitSub(sub: string): string[] {
  return sub
    .split(/\s*[·•|]\s*|\s+[-–—]\s+|,\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------- sections */

function experienceItems(lines: string[]): ExperienceItem[] {
  return groupEntries(lines).map(e => {
    const parts = splitSub(e.sub);
    return {
      id: uid(),
      role: e.title,
      company: parts[0] ?? '',
      location: parts[1] ?? '',
      startDate: e.range?.startDate ?? '',
      endDate: e.range?.endDate ?? '',
      current: e.range?.current ?? false,
      bullets: e.bullets,
    };
  });
}

/** A grade looks like "8.6 CGPA", "First Class", "72%". */
const SCORE = /\b(?:cgpa|gpa|percentage|aggregate)\b[:\s]*[\d.]+\s*(?:\/\s*[\d.]+)?|\b[\d.]+\s*(?:cgpa|gpa)\b|\b\d{1,3}(?:\.\d+)?\s?%|\bfirst class\b|\bdistinction\b/i;

function educationItems(lines: string[]): EducationItem[] {
  return groupEntries(lines).map(e => {
    const parts = splitSub(e.sub);
    const scoreFrom = [e.sub, ...e.bullets].join(' · ');
    const score = SCORE.exec(scoreFrom);
    return {
      id: uid(),
      degree: e.title,
      institution: parts.find(p => !SCORE.test(p)) ?? '',
      location: parts.filter(p => !SCORE.test(p))[1] ?? '',
      startDate: e.range?.startDate ?? '',
      endDate: e.range?.endDate ?? '',
      current: e.range?.current ?? false,
      score: score ? score[0].trim() : '',
      bullets: e.bullets,
    };
  });
}

function projectItems(lines: string[]): ProjectItem[] {
  return groupEntries(lines).map(e => {
    const parts = splitSub(e.sub);
    const url = URL.exec([e.sub, ...e.bullets].join(' '));
    return {
      id: uid(),
      name: e.title,
      role: parts.find(p => !URL.test(p)) ?? '',
      url: url ? url[0] : '',
      startDate: e.range?.startDate ?? '',
      endDate: e.range?.endDate ?? '',
      current: e.range?.current ?? false,
      bullets: e.bullets,
    };
  });
}

/**
 * Skills arrive either grouped ("Languages: Java, Python") or as a plain
 * list. Both are common and the colon is the only reliable signal.
 */
function skillItems(lines: string[]): SkillItem[] {
  const items: SkillItem[] = [];

  for (const raw of lines) {
    const line = isBullet(raw) ? stripBullet(raw) : raw;
    if (!line) continue;

    // "Languages: Java, Python" is the clear case. Word processors often
    // drop the colon when the label was styled rather than typed, leaving
    // "Languages Java, Python" — so a capitalised label followed by a
    // comma-separated list counts too.
    const grouped =
      /^([A-Za-z][\w\s&/+-]{1,30}?)\s*:\s*(.+)$/.exec(line) ??
      /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+([A-Z][^,]{0,40},.+)$/.exec(line);
    const group = grouped ? grouped[1].trim() : '';
    const body = grouped ? grouped[2] : line;

    const values = body
      .split(/\s*[,;|•·/]\s*|\s{2,}/)
      .map(v => v.trim())
      .filter(v => v.length > 0 && v.length <= 40);

    if (values.length) items.push({ id: uid(), group, values });
  }

  return items;
}

function languageItems(lines: string[]): LanguageItem[] {
  const items: LanguageItem[] = [];

  for (const raw of lines) {
    const line = isBullet(raw) ? stripBullet(raw) : raw;
    if (!line) continue;

    // "English - Native", "English (Fluent)", or several on one line.
    for (const part of line.split(/\s*[,;|]\s*/)) {
      const entry = part.trim();
      if (!entry) continue;
      const paired = /^([A-Za-z][A-Za-z\s]{1,24}?)\s*(?:[-–—:(]\s*)([^)]+)\)?$/.exec(entry);
      if (paired) {
        items.push({ id: uid(), name: paired[1].trim(), proficiency: paired[2].trim() });
      } else if (entry.length <= 28) {
        items.push({ id: uid(), name: entry, proficiency: '' });
      }
    }
  }

  return items;
}

function certificationItems(lines: string[]): CertificationItem[] {
  return groupEntries(lines).map(e => {
    const parts = splitSub(e.sub);
    const url = URL.exec([e.sub, ...e.bullets].join(' '));
    return {
      id: uid(),
      name: e.title,
      issuer: parts.find(p => !URL.test(p)) ?? '',
      date: e.range?.startDate ?? '',
      url: url ? url[0] : '',
    };
  });
}

function buildSection(type: SectionType, lines: string[], order: number): Section | null {
  const base = emptySection(type, order);

  switch (type) {
    case 'experience':
      base.items = experienceItems(lines);
      break;
    case 'education':
      base.items = educationItems(lines);
      break;
    case 'skills':
      base.items = skillItems(lines);
      break;
    case 'projects':
      base.items = projectItems(lines);
      break;
    case 'certifications':
      base.items = certificationItems(lines);
      break;
    case 'languages':
      base.items = languageItems(lines);
      break;
    default:
      return null;
  }

  return base.items.length ? base : null;
}

/* -------------------------------------------------------------- assemble */

export function parseResumeText(raw: string, title = 'Imported resume'): ImportResult {
  const lines = unwrapLines(normaliseText(raw));
  const blocks = segment(lines);
  const resume = createResume(title);

  const header = blocks.find(b => b.type === 'header')?.lines ?? [];
  const contact = extractContact(header.length ? header : lines);
  const name = extractName(header);

  resume.basics = { ...resume.basics, ...contact, fullName: name };

  const summaryBlock = blocks.find(b => b.type === 'summary');
  if (summaryBlock) {
    resume.summary = summaryBlock.lines
      .map(l => (isBullet(l) ? stripBullet(l) : l))
      .join(' ')
      .trim();
  } else if (header.length) {
    // No summary heading: a long paragraph in the header is almost always
    // one, and dropping it would lose the user's own description of
    // themselves.
    const paragraph = header.find(l => l.length > 120);
    if (paragraph) resume.summary = paragraph;
  }

  const sections: Section[] = [];
  const seen = new Set<SectionType>();

  for (const block of blocks) {
    if (block.type === 'header' || block.type === 'summary') continue;
    if (seen.has(block.type)) continue;
    const section = buildSection(block.type, block.lines, sections.length);
    if (section) {
      sections.push(section);
      seen.add(block.type);
    }
  }

  // A parse that found nothing still has to open in the editor rather than
  // as a blank screen, so fall back to the starter sections.
  resume.sections = sections.length
    ? sections
    : createResume().sections.map((s, i) => ({ ...s, order: i }));

  return {
    resume,
    stats: {
      sections: sections.map(s => s.type),
      entries: sections.reduce((n, s) => n + s.items.length, 0),
      foundName: !!name,
      foundEmail: !!contact.email,
      foundPhone: !!contact.phone,
    },
  };
}

/** One line for the dialog that opens after an import. */
export function importSummary(stats: ImportStats): string {
  if (!stats.sections.length && !stats.foundName) {
    return 'We could not read much from that file. Everything is blank, so you can type over it.';
  }

  const parts: string[] = [];
  if (stats.entries) {
    parts.push(`${stats.entries} ${stats.entries === 1 ? 'entry' : 'entries'}`);
  }
  if (stats.sections.length) {
    parts.push(
      `${stats.sections.length} ${stats.sections.length === 1 ? 'section' : 'sections'}`,
    );
  }

  const found = parts.length ? `Found ${parts.join(' across ')}.` : '';
  return `${found} Check everything before you export — a resume laid out in columns does not always come apart cleanly.`.trim();
}
