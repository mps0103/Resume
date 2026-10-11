import { Resume } from '../types/resume';

export type TemplateTier = 'free' | 'premium';

export interface RenderOptions {
  /** Preview adds an on-screen page guide; export must never include it. */
  mode: 'preview' | 'export';
  /** Applied on export for non-subscribers. */
  watermark?: boolean;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  /** One line shown under the thumbnail in the gallery. */
  blurb: string;
  tier: TemplateTier;
  supportsPhoto: boolean;
  /**
   * False for anything with a sidebar or multiple columns. Applicant
   * tracking systems read the PDF text stream in order, and columns
   * interleave into nonsense. The gallery must surface this — a beautiful
   * resume that no parser can read costs the user interviews.
   */
  atsSafe: boolean;
  /** Designs whose backgrounds or columns only work on a single page. */
  onePageOnly?: boolean;
  /** Accents the template was designed against; first is the default. */
  accents: string[];
  /** Must return a complete HTML document. */
  render(resume: Resume, opts: RenderOptions): string;
}
