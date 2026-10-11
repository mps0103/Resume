/**
 * Single source of truth for resume data.
 * Everything is stored as one JSON blob per resume.
 * Bump SCHEMA_VERSION whenever a field's meaning changes, and add a
 * migration step in db/migrations.ts. Never repurpose an old field name.
 */

export const SCHEMA_VERSION = 2;

export type SectionType =
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'custom';

/** Dates are stored as 'YYYY-MM' or '' — never as Date objects. */
export type YearMonth = string;

export interface Link {
  id: string;
  label: string;
  url: string;
}

export interface Basics {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: Link[];
  /** Local file uri. Templates with supportsPhoto=false ignore it. */
  photoUri?: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: YearMonth;
  endDate: YearMonth;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: YearMonth;
  endDate: YearMonth;
  current: boolean;
  score: string;
  bullets: string[];
}

export interface SkillItem {
  id: string;
  /** Optional grouping, e.g. "Languages", "Tools". Empty = ungrouped. */
  group: string;
  values: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  url: string;
  startDate: YearMonth;
  endDate: YearMonth;
  current: boolean;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: YearMonth;
  url: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  /** Free text: "Native", "Professional", "B2". Not an enum — regions vary. */
  proficiency: string;
}

export interface CustomItem {
  id: string;
  title: string;
  subtitle: string;
  startDate: YearMonth;
  endDate: YearMonth;
  current: boolean;
  bullets: string[];
}

export type SectionItem =
  | ExperienceItem
  | EducationItem
  | SkillItem
  | ProjectItem
  | CertificationItem
  | LanguageItem
  | CustomItem;

interface SectionBase {
  id: string;
  /** User-editable heading. Defaults come from DEFAULT_SECTION_TITLES. */
  title: string;
  visible: boolean;
  order: number;
}

export interface ExperienceSection extends SectionBase {
  type: 'experience';
  items: ExperienceItem[];
}
export interface EducationSection extends SectionBase {
  type: 'education';
  items: EducationItem[];
}
export interface SkillsSection extends SectionBase {
  type: 'skills';
  items: SkillItem[];
}
export interface ProjectsSection extends SectionBase {
  type: 'projects';
  items: ProjectItem[];
}
export interface CertificationsSection extends SectionBase {
  type: 'certifications';
  items: CertificationItem[];
}
export interface LanguagesSection extends SectionBase {
  type: 'languages';
  items: LanguageItem[];
}
export interface CustomSection extends SectionBase {
  type: 'custom';
  items: CustomItem[];
}

export type Section =
  | ExperienceSection
  | EducationSection
  | SkillsSection
  | ProjectsSection
  | CertificationsSection
  | LanguagesSection
  | CustomSection;

/**
 * The closing declaration, signature and date.
 *
 * Kept off the Section list on purpose. It is not a list of entries the user
 * reorders — it is a fixed closing block that convention puts last, below
 * everything else, and a section that could be dragged into the middle of a
 * resume would only ever be dragged there by accident.
 *
 * Widely expected in India and much of South Asia; rarely used in US or
 * European applications. On by default because it is easier to switch off a
 * block you can see than to discover one you never knew existed.
 */
export interface Declaration {
  enabled: boolean;
  text: string;
  /** Printed under the signature rule. Empty falls back to basics.fullName. */
  signatureName: string;
  /** City the resume is signed in. Empty hides the line entirely. */
  place: string;
  /** 'YYYY-MM-DD' or ''. Empty hides the line. */
  date: string;
  /** Draws the ruled line people sign across on a printed copy. */
  showSignatureLine: boolean;
}

export const DEFAULT_DECLARATION_TEXT =
  'I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief.';

export function defaultDeclaration(): Declaration {
  return {
    enabled: true,
    text: DEFAULT_DECLARATION_TEXT,
    signatureName: '',
    place: '',
    date: '',
    showSignatureLine: true,
  };
}

export interface Resume {
  schemaVersion: number;
  id: string;
  /** User-facing name of the document, not the person. */
  title: string;
  createdAt: number;
  updatedAt: number;
  basics: Basics;
  summary: string;
  sections: Section[];
  /** Which template was last used, so preview reopens where they left off. */
  templateId: string;
  /** Per-resume look settings a template may honour. */
  style: ResumeStyle;
  /** Closing declaration block. Always rendered last, by every template. */
  declaration: Declaration;
}

export interface ResumeStyle {
  accent: string;
  /** Multiplier applied to the template's base size. 0.9 - 1.15. */
  fontScale: number;
  /** Multiplier applied to vertical rhythm. 0.85 - 1.2. */
  density: number;
  pageSize: 'A4' | 'Letter';
}

export const DEFAULT_STYLE: ResumeStyle = {
  accent: '#1F3A5F',
  fontScale: 1,
  density: 1,
  pageSize: 'A4',
};

export const DEFAULT_SECTION_TITLES: Record<SectionType, string> = {
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  custom: 'More',
};

/** Row shape for the resume list screen — avoids parsing every JSON blob. */
export interface ResumeSummary {
  id: string;
  title: string;
  fullName: string;
  templateId: string;
  updatedAt: number;
}
