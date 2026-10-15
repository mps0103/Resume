import {
  extractContact,
  extractName,
  findDateRange,
  groupEntries,
  headingType,
  importSummary,
  isBullet,
  normaliseText,
  parseResumeText,
  segment,
} from '../services/resumeImport';
import { ExperienceItem, EducationItem, SkillItem } from '../types/resume';

/** The layout most Indian and UK resumes use: title, then company line. */
const TYPICAL = `
PRIYA SHARMA
Senior Software Engineer
priya.sharma@example.com | +91 98765 43210 | Bengaluru, India
linkedin.com/in/priyasharma

PROFESSIONAL SUMMARY
Engineer with seven years building payments infrastructure, focused on
reliability and on systems that survive real traffic.

WORK EXPERIENCE
Senior Software Engineer
Acme Payments · Bengaluru · Mar 2021 – Present
• Led the migration of settlement to an event-driven pipeline.
• Cut p99 latency from 1.4s to 240ms.

Software Engineer
Globex Systems · Pune · Jun 2018 - Feb 2021
• Built the reconciliation service still used for every payout.

EDUCATION
B.E. Computer Science
Pune Institute of Technology · 8.6 CGPA · Aug 2014 – May 2018

TECHNICAL SKILLS
Languages: Java, Kotlin, Python
Tools: Postgres, Kafka, Docker

LANGUAGES
English - Native, Hindi - Fluent, Marathi - Conversational
`;

describe('normalising extracted text', () => {
  it('strips the debris PDF and Word extraction leave behind', () => {
    // A non-breaking space becomes a real space; a zero-width space is
    // removed outright, so the word either side of it closes up.
    const lines = normaliseText('A B\r\nC​D\r\n\n\n  E  ');
    expect(lines).toEqual(['A B', 'CD', '', 'E']);
  });

  it('recognises the bullet glyph whichever template produced it', () => {
    for (const marker of ['•', '●', '▪', '◦', '*', '-', '–', '+']) {
      expect(isBullet(`${marker} did a thing`)).toBe(true);
    }
    // A hyphenated word at the start of a line is not a bullet.
    expect(isBullet('Co-ordinated the release')).toBe(false);
  });
});

describe('heading detection', () => {
  it('maps the many names for the same section', () => {
    for (const h of [
      'WORK EXPERIENCE', 'Employment History', 'Professional Background',
      'Experience:', 'experience',
    ]) {
      expect(headingType(h)).toBe('experience');
    }
    expect(headingType('Educational Qualifications')).toBe('education');
    expect(headingType('Core Competencies')).toBe('skills');
    expect(headingType('Career Objective')).toBe('summary');
    expect(headingType('Languages Known')).toBe('languages');
  });

  it('does not treat a sentence as a heading', () => {
    expect(headingType('Experience building distributed systems at scale')).toBeNull();
    expect(headingType('Led the skills matrix project')).toBeNull();
  });

  it('puts everything before the first heading in the header block', () => {
    const blocks = segment(normaliseText(TYPICAL));
    expect(blocks[0].type).toBe('header');
    expect(blocks[0].lines).toContain('PRIYA SHARMA');
    expect(blocks.map(b => b.type)).toEqual(
      expect.arrayContaining(['summary', 'experience', 'education', 'skills', 'languages']),
    );
  });
});

describe('date ranges', () => {
  it('reads the common spellings of a range', () => {
    expect(findDateRange('Mar 2021 – Present')).toMatchObject({
      startDate: '2021-03', endDate: '', current: true,
    });
    expect(findDateRange('Jun 2018 - Feb 2021')).toMatchObject({
      startDate: '2018-06', endDate: '2021-02', current: false,
    });
    expect(findDateRange('01/2019 to 12/2020')).toMatchObject({
      startDate: '2019-01', endDate: '2020-12',
    });
    expect(findDateRange('2014 – 2018')).toMatchObject({
      startDate: '2014-01', endDate: '2018-01',
    });
  });

  it('treats every word for "still there" as current', () => {
    for (const word of ['Present', 'Current', 'Now', 'Till Date', 'Ongoing']) {
      expect(findDateRange(`Jan 2020 – ${word}`)?.current).toBe(true);
    }
  });

  /**
   * The single most damaging false positive. A bare four-digit number in a
   * sentence would otherwise split that sentence off as a new job.
   */
  it('does not find a date in prose that merely contains a number', () => {
    expect(findDateRange('Cut p99 latency from 1400ms to 240ms')).toBeNull();
    expect(
      findDateRange(
        'Owned the migration of a service handling 2024 requests per second across the estate',
      ),
    ).toBeNull();
  });

  it('accepts a lone month-year, which is how certifications are dated', () => {
    expect(findDateRange('AWS Solutions Architect — May 2024')).toMatchObject({
      startDate: '2024-05', current: false,
    });
  });
});

describe('contact details', () => {
  const header = normaliseText(TYPICAL).slice(0, 5);

  it('picks out email, phone, location and links', () => {
    const contact = extractContact(header);
    expect(contact.email).toBe('priya.sharma@example.com');
    expect(contact.phone).toContain('98765');
    expect(contact.location).toBe('Bengaluru, India');
    expect(contact.links?.[0].url).toContain('linkedin.com/in/priyasharma');
  });

  it('never reads digits out of an email address as a phone number', () => {
    const contact = extractContact(['contact: user2024@example.com']);
    expect(contact.email).toBe('user2024@example.com');
    expect(contact.phone).toBeUndefined();
  });

  it('takes the name from the top and not from a contact line', () => {
    expect(extractName(header)).toBe('PRIYA SHARMA');
    expect(extractName(['jane.doe@example.com', 'Jane Doe'])).toBe('Jane Doe');
  });

  it('refuses a line with digits or a heading as a name', () => {
    expect(extractName(['+91 98765 43210', 'WORK EXPERIENCE', 'Ravi Kumar'])).toBe('Ravi Kumar');
  });
});

describe('grouping entries', () => {
  it('starts a new entry at each date range and keeps bullets with it', () => {
    const entries = groupEntries([
      'Senior Software Engineer',
      'Acme Payments · Bengaluru · Mar 2021 – Present',
      '• Led the migration.',
      '• Cut latency.',
      'Software Engineer',
      'Globex Systems · Pune · Jun 2018 - Feb 2021',
      '• Built reconciliation.',
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0].title).toBe('Senior Software Engineer');
    expect(entries[0].bullets).toHaveLength(2);
    expect(entries[1].title).toBe('Software Engineer');
    expect(entries[1].bullets).toEqual(['Built reconciliation.']);
  });

  /**
   * The other common layout, where the date sits on the title line. The
   * parser must not then read the company as the job title.
   */
  it('handles the date being on the title line instead', () => {
    const entries = groupEntries([
      'Product Designer — Initech — Jan 2020 – Dec 2022',
      '• Ran the design system.',
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toContain('Product Designer');
    expect(entries[0].bullets).toEqual(['Ran the design system.']);
  });

  it('keeps text it cannot classify rather than dropping it', () => {
    const entries = groupEntries(['Some unlabelled achievement line']);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Some unlabelled achievement line');
  });
});

describe('parsing a whole resume', () => {
  const { resume, stats } = parseResumeText(TYPICAL);

  it('fills in who the person is', () => {
    expect(resume.basics.fullName).toBe('PRIYA SHARMA');
    expect(resume.basics.email).toBe('priya.sharma@example.com');
    expect(resume.basics.location).toBe('Bengaluru, India');
    expect(stats.foundName && stats.foundEmail && stats.foundPhone).toBe(true);
  });

  it('keeps the summary', () => {
    expect(resume.summary).toContain('payments infrastructure');
  });

  it('reads both jobs with their dates and bullets', () => {
    const experience = resume.sections.find(s => s.type === 'experience');
    const items = experience?.items as ExperienceItem[];
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      role: 'Senior Software Engineer',
      company: 'Acme Payments',
      location: 'Bengaluru',
      startDate: '2021-03',
      current: true,
    });
    expect(items[0].bullets).toHaveLength(2);
    expect(items[1]).toMatchObject({ company: 'Globex Systems', endDate: '2021-02' });
  });

  it('reads the degree and pulls the grade out of the line', () => {
    const education = resume.sections.find(s => s.type === 'education');
    const items = education?.items as EducationItem[];
    expect(items[0]).toMatchObject({
      degree: 'B.E. Computer Science',
      institution: 'Pune Institute of Technology',
      startDate: '2014-08',
    });
    expect(items[0].score).toMatch(/8\.6/);
  });

  it('keeps skill groups rather than flattening them', () => {
    const skills = resume.sections.find(s => s.type === 'skills');
    const items = skills?.items as SkillItem[];
    expect(items.map(i => i.group)).toEqual(['Languages', 'Tools']);
    expect(items[0].values).toEqual(['Java', 'Kotlin', 'Python']);
  });

  it('splits languages and their proficiency', () => {
    const languages = resume.sections.find(s => s.type === 'languages');
    expect(languages?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'English', proficiency: 'Native' }),
        expect.objectContaining({ name: 'Hindi', proficiency: 'Fluent' }),
      ]),
    );
  });

  it('orders the sections contiguously from zero, as the editor expects', () => {
    const orders = resume.sections.map(s => s.order);
    expect(orders).toEqual(orders.map((_, i) => i));
  });
});

describe('when the file barely parses', () => {
  /**
   * Opening an empty editor is acceptable. Crashing, or opening a document
   * with no sections at all, is not — the user still has to be able to type
   * their resume in.
   */
  it('still returns an editable document for junk input', () => {
    for (const input of ['', '   ', '\n\n\n', 'ÿþ\u0000 garbage']) {
      const { resume } = parseResumeText(input);
      expect(resume.sections.length).toBeGreaterThan(0);
      expect(resume.schemaVersion).toBeGreaterThan(0);
      expect(resume.declaration).toBeDefined();
    }
  });

  it('says so plainly rather than claiming success', () => {
    const { stats } = parseResumeText('');
    expect(importSummary(stats)).toMatch(/could not read/i);
  });

  it('warns that a parse needs checking when it did find things', () => {
    const { stats } = parseResumeText(TYPICAL);
    expect(importSummary(stats)).toMatch(/check everything/i);
  });
});
