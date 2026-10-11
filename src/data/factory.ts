import {
  DEFAULT_SECTION_TITLES,
  DEFAULT_STYLE,
  defaultDeclaration,
  Resume,
  SCHEMA_VERSION,
  Section,
  SectionType,
} from '../types/resume';

/** Collision-resistant enough for local-only ids; no crypto dependency. */
export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

const STARTER_SECTIONS: SectionType[] = [
  'experience',
  'education',
  'skills',
  'projects',
];

export function emptySection(type: SectionType, order: number): Section {
  return {
    id: uid(),
    type,
    title: DEFAULT_SECTION_TITLES[type],
    visible: true,
    order,
    items: [],
  } as Section;
}

export function createResume(title = 'Untitled resume'): Resume {
  const now = Date.now();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: uid(),
    title,
    createdAt: now,
    updatedAt: now,
    templateId: 'classic',
    style: { ...DEFAULT_STYLE },
    declaration: defaultDeclaration(),
    summary: '',
    basics: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      links: [],
    },
    sections: STARTER_SECTIONS.map((t, i) => emptySection(t, i)),
  };
}

/**
 * Deliberately awkward fixture: over-long bullets, an ungrouped skill row, a
 * still-current role with no end date, and every section type populated. It
 * exists to break templates early, so keep the awkward parts — a tidy sample
 * proves nothing.
 *
 * It is also deliberately longer than one page. A one-page sample cannot show
 * whether a design paginates, whether a section splits across a page break,
 * or whether the onePageOnly designs degrade the way the gallery warns they
 * will. Keep it over the looksMultiPage threshold; backup.test.ts pins that.
 *
 * Every value is a reserved placeholder rather than a real person, company
 * or place: example.com is reserved by IANA, +1 555 01xx is the reserved
 * fiction range, and Acme and Globex are the standard stand-in companies.
 * Nothing here should look like it was copied from someone's actual CV.
 */
export function sampleResume(): Resume {
  const base = createResume('Sample resume');
  base.basics = {
    fullName: 'Jane Doe',
    headline: 'Software Engineer',
    email: 'jane.doe@example.com',
    phone: '+1 555 0142',
    location: 'Remote',
    links: [
      { id: uid(), label: 'github.com/janedoe', url: 'https://github.com/janedoe' },
      { id: uid(), label: 'linkedin.com/in/janedoe', url: 'https://linkedin.com/in/janedoe' },
    ],
  };
  base.summary =
    'Software engineer with six years building production web and mobile applications, focused on rendering performance, offline-first architecture and design systems that survive contact with real content.';

  base.sections = [
    {
      id: uid(),
      type: 'experience',
      title: 'Experience',
      visible: true,
      order: 0,
      items: [
        {
          id: uid(),
          role: 'Senior Software Engineer',
          company: 'Acme Corporation',
          location: 'Remote',
          startDate: '2022-04',
          endDate: '',
          current: true,
          bullets: [
            'Rebuilt the customer onboarding flow, cutting median completion time from 11 minutes to under 4 by collapsing six screens into a single progressive form with resumable state.',
            'Introduced a shared component contract across three product teams, removing 40+ duplicated form primitives.',
            'Owned the content pipeline so product could ship wording changes without a release.',
          ],
        },
        {
          id: uid(),
          role: 'Software Engineer',
          company: 'Globex Ltd',
          location: 'Remote',
          startDate: '2019-07',
          endDate: '2022-03',
          current: false,
          bullets: [
            'Shipped an offline-capable mobile app to 200k installs, with a local-first sync layer that resolved conflicts without ever blocking the user.',
            'Reduced cold start by 1.2s by deferring analytics and moving the first screen off the network path.',
            'Wrote the migration runner still used for every schema change, with a rollback path proven against production snapshots.',
          ],
        },
        {
          id: uid(),
          role: 'Junior Developer',
          company: 'Initech',
          location: 'Remote',
          startDate: '2017-06',
          endDate: '2019-06',
          current: false,
          bullets: [
            'Built the internal design-system documentation site, which cut new-joiner setup from two days to an afternoon.',
            'Took the flaky end-to-end suite from a 40% false-failure rate to under 2%.',
            'Owned the accessibility audit that took the checkout flow to WCAG 2.1 AA.',
          ],
        },
      ],
    },
    {
      id: uid(),
      type: 'education',
      title: 'Education',
      visible: true,
      order: 1,
      items: [
        {
          id: uid(),
          degree: 'M.Sc. Human-Computer Interaction',
          institution: 'Northern Institute of Technology',
          location: 'Remote',
          startDate: '2019-09',
          endDate: '2021-06',
          current: false,
          score: 'Distinction',
          bullets: [
            'Thesis on offline-first interaction patterns for low-connectivity regions.',
          ],
        },
        {
          id: uid(),
          degree: 'B.Sc. Computer Science',
          institution: 'State University',
          location: 'Remote',
          startDate: '2015-08',
          endDate: '2019-06',
          current: false,
          score: 'GPA 3.8 / 4.0',
          bullets: [
            'Coursework in distributed systems, compilers and databases.',
          ],
        },
      ],
    },
    {
      id: uid(),
      type: 'skills',
      title: 'Skills',
      visible: true,
      order: 2,
      items: [
        {
          id: uid(),
          group: 'Languages',
          values: ['TypeScript', 'JavaScript', 'Kotlin', 'SQL'],
        },
        {
          id: uid(),
          group: 'Frameworks',
          values: ['React', 'React Native', 'Next.js', 'Jest', 'Detox'],
        },
        {
          id: uid(),
          group: 'Practices',
          values: ['Accessibility', 'Performance budgets', 'Trunk-based development'],
        },
        { id: uid(), group: '', values: ['Figma', 'CI/CD', 'Docker'] },
      ],
    },
    {
      id: uid(),
      type: 'projects',
      title: 'Projects',
      visible: true,
      order: 3,
      items: [
        {
          id: uid(),
          name: 'Offline Notes App',
          role: 'Solo developer',
          url: 'https://example.com/notes',
          startDate: '2026-03',
          endDate: '',
          current: true,
          bullets: [
            'Fully offline mobile note-taking app published to an app store.',
            'Conflict-free sync built on CRDTs, so two devices editing the same note never lose a keystroke.',
          ],
        },
        {
          id: uid(),
          name: 'Open Source Chart Toolkit',
          role: 'Maintainer',
          url: 'https://example.com/charts',
          startDate: '2023-01',
          endDate: '2025-11',
          current: false,
          bullets: [
            'Rendering library used by roughly 4,000 projects, with a documented accessibility contract for every chart type.',
          ],
        },
      ],
    },
    {
      id: uid(),
      type: 'certifications',
      title: 'Certifications',
      visible: true,
      order: 4,
      items: [
        {
          id: uid(),
          name: 'Professional Cloud Developer',
          issuer: 'Example Cloud',
          date: '2024-05',
          url: 'https://example.com/cert/cloud',
        },
        {
          id: uid(),
          name: 'Accessibility Specialist (WAS)',
          issuer: 'Example Accessibility Board',
          date: '2023-02',
          url: '',
        },
      ],
    },
    {
      id: uid(),
      type: 'languages',
      title: 'Languages',
      visible: true,
      order: 5,
      items: [
        { id: uid(), name: 'English', proficiency: 'Native' },
        { id: uid(), name: 'Spanish', proficiency: 'Professional' },
        { id: uid(), name: 'German', proficiency: 'B1' },
      ],
    },
  ];

  // Filled in, unlike a new resume, so the declaration can actually be judged
  // in the gallery: an empty place and date collapse the closing row to just
  // a signature rule, which is not what a finished one looks like.
  base.declaration = {
    ...defaultDeclaration(),
    place: 'Springfield',
    date: '2026-01-15',
  };

  return base;
}
