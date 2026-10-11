import { Resume } from '../types/resume';

export interface Completeness {
  /** 0 - 1. */
  score: number;
  /** Highest-value missing thing, phrased as an action. Null when done. */
  nextStep: string | null;
}

interface Check {
  weight: number;
  done: (r: Resume) => boolean;
  prompt: string;
}

/**
 * Ordered by how much each one changes the resume's usefulness, not by how
 * hard it is. The prompt shown is always the first unmet check, so the user
 * gets one clear next action instead of a checklist to feel bad about.
 */
const CHECKS: Check[] = [
  {
    weight: 3,
    done: r => !!r.basics.fullName.trim(),
    prompt: 'Add your name',
  },
  {
    weight: 3,
    done: r => !!r.basics.email.trim() || !!r.basics.phone.trim(),
    prompt: 'Add an email or phone number so people can reach you',
  },
  {
    weight: 2,
    done: r => !!r.basics.headline.trim(),
    prompt: 'Add a headline — the role you want, not the one you have',
  },
  {
    weight: 4,
    done: r =>
      r.sections.some(
        s => s.type === 'experience' && s.items.length > 0,
      ),
    prompt: 'Add your most recent role',
  },
  {
    weight: 4,
    done: r =>
      r.sections.some(
        s =>
          s.type === 'experience' &&
          s.items.some((i: any) => i.bullets?.some((b: string) => b.trim())),
      ),
    prompt: 'Add highlights to your roles — what changed because you were there',
  },
  {
    weight: 2,
    done: r => r.sections.some(s => s.type === 'skills' && s.items.length > 0),
    prompt: 'Add your skills',
  },
  {
    weight: 2,
    done: r => r.sections.some(s => s.type === 'education' && s.items.length > 0),
    prompt: 'Add your education',
  },
  {
    weight: 2,
    done: r => !!r.summary.trim(),
    prompt: 'Write a short summary',
  },
  {
    weight: 1,
    done: r => r.basics.links.some(l => l.label.trim()),
    prompt: 'Add a portfolio or profile link',
  },
  {
    weight: 1,
    done: r =>
      r.sections.some(
        s =>
          s.type === 'experience' &&
          s.items.some((i: any) =>
            i.bullets?.some((b: string) => /\d/.test(b)),
          ),
      ),
    prompt: 'Put a number in at least one highlight',
  },
];

export function completeness(resume: Resume): Completeness {
  const total = CHECKS.reduce((n, c) => n + c.weight, 0);
  let earned = 0;
  let nextStep: string | null = null;

  for (const c of CHECKS) {
    if (c.done(resume)) earned += c.weight;
    else if (!nextStep) nextStep = c.prompt;
  }

  return { score: earned / total, nextStep };
}
