import {
  Basics,
  Declaration,
  Resume,
  Section,
  SectionItem,
  SectionType,
} from '../types/resume';
import { emptySection, uid } from './factory';

/**
 * Every editor screen mutates through these so section ordering, id
 * generation and array cloning stay in one place. Nothing mutates a draft
 * in place — the autosave hook compares by reference.
 */

export function setBasics(resume: Resume, patch: Partial<Basics>): Resume {
  return { ...resume, basics: { ...resume.basics, ...patch } };
}

export function setSummary(resume: Resume, summary: string): Resume {
  return { ...resume, summary };
}

export function setTitle(resume: Resume, title: string): Resume {
  return { ...resume, title };
}

export function setTemplate(resume: Resume, templateId: string): Resume {
  return { ...resume, templateId };
}

export function setDeclaration(
  resume: Resume,
  patch: Partial<Declaration>,
): Resume {
  return { ...resume, declaration: { ...resume.declaration, ...patch } };
}

export function setStyle(
  resume: Resume,
  patch: Partial<Resume['style']>,
): Resume {
  return { ...resume, style: { ...resume.style, ...patch } };
}

export function addLink(resume: Resume): Resume {
  return setBasics(resume, {
    links: [...resume.basics.links, { id: uid(), label: '', url: '' }],
  });
}

export function updateLink(
  resume: Resume,
  linkId: string,
  patch: { label?: string; url?: string },
): Resume {
  return setBasics(resume, {
    links: resume.basics.links.map(l =>
      l.id === linkId ? { ...l, ...patch } : l,
    ),
  });
}

export function removeLink(resume: Resume, linkId: string): Resume {
  return setBasics(resume, {
    links: resume.basics.links.filter(l => l.id !== linkId),
  });
}

function replaceSection(resume: Resume, next: Section): Resume {
  return {
    ...resume,
    sections: resume.sections.map(s => (s.id === next.id ? next : s)),
  };
}

export function getSection(resume: Resume, sectionId: string): Section | undefined {
  return resume.sections.find(s => s.id === sectionId);
}

export function renameSection(
  resume: Resume,
  sectionId: string,
  title: string,
): Resume {
  const s = getSection(resume, sectionId);
  return s ? replaceSection(resume, { ...s, title }) : resume;
}

export function toggleSectionVisible(resume: Resume, sectionId: string): Resume {
  const s = getSection(resume, sectionId);
  return s ? replaceSection(resume, { ...s, visible: !s.visible }) : resume;
}

export function addSection(resume: Resume, type: SectionType): Resume {
  const order = resume.sections.length;
  return { ...resume, sections: [...resume.sections, emptySection(type, order)] };
}

export function removeSection(resume: Resume, sectionId: string): Resume {
  return {
    ...resume,
    sections: resume.sections
      .filter(s => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i })),
  };
}

/** Moves a section by delta and renumbers. No-op at the ends. */
export function moveSection(
  resume: Resume,
  sectionId: string,
  delta: number,
): Resume {
  const ordered = [...resume.sections].sort((a, b) => a.order - b.order);
  const from = ordered.findIndex(s => s.id === sectionId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ordered.length) return resume;
  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  return { ...resume, sections: ordered.map((s, i) => ({ ...s, order: i })) };
}

export function addItem(
  resume: Resume,
  sectionId: string,
  item: SectionItem,
): Resume {
  const s = getSection(resume, sectionId);
  if (!s) return resume;
  return replaceSection(resume, { ...s, items: [...s.items, item] } as Section);
}

export function updateItem(
  resume: Resume,
  sectionId: string,
  itemId: string,
  patch: Record<string, unknown>,
): Resume {
  const s = getSection(resume, sectionId);
  if (!s) return resume;
  const items = (s.items as SectionItem[]).map(i =>
    i.id === itemId ? { ...i, ...patch } : i,
  );
  return replaceSection(resume, { ...s, items } as Section);
}

export function removeItem(
  resume: Resume,
  sectionId: string,
  itemId: string,
): Resume {
  const s = getSection(resume, sectionId);
  if (!s) return resume;
  const items = (s.items as SectionItem[]).filter(i => i.id !== itemId);
  return replaceSection(resume, { ...s, items } as Section);
}

export function moveItem(
  resume: Resume,
  sectionId: string,
  itemId: string,
  delta: number,
): Resume {
  const s = getSection(resume, sectionId);
  if (!s) return resume;
  const items = [...(s.items as SectionItem[])];
  const from = items.findIndex(i => i.id === itemId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= items.length) return resume;
  const [moved] = items.splice(from, 1);
  items.splice(to, 0, moved);
  return replaceSection(resume, { ...s, items } as Section);
}

/** New blank item shaped for the section type. */
export function blankItem(type: SectionType): SectionItem {
  const id = uid();
  switch (type) {
    case 'experience':
      return { id, role: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] };
    case 'education':
      return { id, degree: '', institution: '', location: '', startDate: '', endDate: '', current: false, score: '', bullets: [] };
    case 'skills':
      return { id, group: '', values: [] };
    case 'projects':
      return { id, name: '', role: '', url: '', startDate: '', endDate: '', current: false, bullets: [''] };
    case 'certifications':
      return { id, name: '', issuer: '', date: '', url: '' };
    case 'languages':
      return { id, name: '', proficiency: '' };
    case 'custom':
      return { id, title: '', subtitle: '', startDate: '', endDate: '', current: false, bullets: [''] };
  }
}

/** One-line preview used in item lists, so rows aren't blank while typing. */
export function itemLabel(type: SectionType, item: any): string {
  switch (type) {
    case 'experience': return item.role || item.company || 'Untitled role';
    case 'education': return item.degree || item.institution || 'Untitled qualification';
    case 'skills': return item.group || (item.values?.[0] ?? 'Untitled group');
    case 'projects': return item.name || 'Untitled project';
    case 'certifications': return item.name || 'Untitled certification';
    case 'languages': return item.name || 'Untitled language';
    case 'custom': return item.title || 'Untitled';
  }
}

export function itemSubLabel(type: SectionType, item: any): string {
  switch (type) {
    case 'experience': return item.company ?? '';
    case 'education': return item.institution ?? '';
    case 'skills': return (item.values ?? []).join(', ');
    case 'projects': return item.role ?? '';
    case 'certifications': return item.issuer ?? '';
    case 'languages': return item.proficiency ?? '';
    case 'custom': return item.subtitle ?? '';
  }
}
