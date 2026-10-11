import { Resume } from '../types/resume';
import { dateRange, formatDay, formatMonth, visibleSections } from '../templates/base';

/**
 * A real .docx writer.
 *
 * The obvious cheat here is to write an HTML file and name it .doc. Word does
 * open those, but they are not Word documents: Google Docs mangles them, some
 * applicant tracking systems reject the extension outright, and the user
 * cannot reliably edit and re-save one. A resume that an employer cannot open
 * is worse than no export at all, so this builds genuine OOXML — a zip of
 * XML parts that Word, Google Docs, LibreOffice and Pages all read natively.
 *
 * Everything in this file is pure: it takes a Resume and returns base64, with
 * no react-native imports, so the whole format is testable off-device.
 *
 * Entries are stored uncompressed (zip STORE). Deflate would roughly halve a
 * file that is already only a few kilobytes, and shipping a compressor to
 * save that is not a trade worth making.
 */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ bytes[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

/** TextEncoder is not guaranteed on every Hermes build, so this is manual. */
function utf8(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let cp = text.charCodeAt(i);
    // Recombine a surrogate pair into the code point it represents.
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        cp = (cp - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
        i++;
      }
    }
    if (cp < 0x80) {
      out.push(cp);
    } else if (cp < 0x800) {
      out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  return Uint8Array.from(out);
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += i + 1 < bytes.length ? B64[(((b1 ?? 0) & 15) << 2) | ((b2 ?? 0) >> 6)] : '=';
    out += i + 2 < bytes.length ? B64[(b2 ?? 0) & 63] : '=';
  }
  return out;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/**
 * A fixed timestamp, so the same resume always produces byte-identical
 * output. Tests can then compare bytes, and a user re-exporting an unchanged
 * document gets an unchanged file. 1 Jan 2024, 00:00, in DOS format.
 */
const DOS_TIME = 0;
const DOS_DATE = ((2024 - 1980) << 9) | (1 << 5) | 1;

function zipStore(entries: ZipEntry[]): Uint8Array {
  const chunks: number[] = [];
  const central: number[] = [];
  const push16 = (a: number[], v: number) => a.push(v & 0xff, (v >> 8) & 0xff);
  const push32 = (a: number[], v: number) =>
    a.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);

  for (const entry of entries) {
    const nameBytes = utf8(entry.name);
    const crc = crc32(entry.data);
    const offset = chunks.length;

    push32(chunks, 0x04034b50);
    push16(chunks, 20); // version needed
    push16(chunks, 0x0800); // UTF-8 names
    push16(chunks, 0); // STORE
    push16(chunks, DOS_TIME);
    push16(chunks, DOS_DATE);
    push32(chunks, crc);
    push32(chunks, entry.data.length);
    push32(chunks, entry.data.length);
    push16(chunks, nameBytes.length);
    push16(chunks, 0); // extra
    for (const b of nameBytes) chunks.push(b);
    for (const b of entry.data) chunks.push(b);

    push32(central, 0x02014b50);
    push16(central, 20); // version made by
    push16(central, 20); // version needed
    push16(central, 0x0800);
    push16(central, 0);
    push16(central, DOS_TIME);
    push16(central, DOS_DATE);
    push32(central, crc);
    push32(central, entry.data.length);
    push32(central, entry.data.length);
    push16(central, nameBytes.length);
    push16(central, 0); // extra
    push16(central, 0); // comment
    push16(central, 0); // disk
    push16(central, 0); // internal attrs
    push32(central, 0); // external attrs
    push32(central, offset);
    for (const b of nameBytes) central.push(b);
  }

  const cdOffset = chunks.length;
  for (const b of central) chunks.push(b);

  push32(chunks, 0x06054b50);
  push16(chunks, 0);
  push16(chunks, 0);
  push16(chunks, entries.length);
  push16(chunks, entries.length);
  push32(chunks, central.length);
  push32(chunks, cdOffset);
  push16(chunks, 0); // comment length

  return Uint8Array.from(chunks);
}

/**
 * XML escaping. Stricter than the HTML escaper: an XML parser rejects the
 * whole document over a stray control character, and Word then reports the
 * file as corrupt rather than skipping the bad run.
 */
export function xmlEscape(value: string | undefined | null): string {
  if (!value) return '';
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) as number;
    // XML 1.0 permits tab, newline and carriage return and nothing else below
    // a space. A single stray control byte makes Word report the entire
    // document as corrupt rather than skipping the run that contains it.
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) continue;
    if (ch === '&') out += '&amp;';
    else if (ch === '<') out += '&lt;';
    else if (ch === '>') out += '&gt;';
    else if (ch === '"') out += '&quot;';
    else if (ch === "'") out += '&apos;';
    else out += ch;
  }
  return out;
}

/** Word measures pages in twips: 1440 to the inch. */
const PAGE_TWIPS = {
  A4: { width: 11906, height: 16838 },
  Letter: { width: 12240, height: 15840 },
};

/** Matches the PRINT_MARGIN used for PDF, so the two exports look alike. */
const MARGIN_TWIPS = { top: 1080, right: 1080, bottom: 1296, left: 1080 };

const GREY = '5A6169';
const FAINT = '8B939C';

function accentHex(resume: Resume): string {
  const raw = (resume.style.accent || '#1F3A5F').replace('#', '').trim();
  return /^[0-9A-Fa-f]{6}$/.test(raw) ? raw.toUpperCase() : '1F3A5F';
}

interface RunOpts {
  bold?: boolean;
  /** Half-points, so 20 is 10pt. */
  size?: number;
  color?: string;
  caps?: boolean;
  italic?: boolean;
}

function run(text: string, o: RunOpts = {}): string {
  const props = [
    o.bold ? '<w:b/>' : '',
    o.italic ? '<w:i/>' : '',
    o.caps ? '<w:caps/>' : '',
    o.color ? `<w:color w:val="${o.color}"/>` : '',
    o.size ? `<w:sz w:val="${o.size}"/><w:szCs w:val="${o.size}"/>` : '',
  ].join('');
  // xml:space="preserve" or Word eats leading and trailing spaces in a run.
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}

interface ParaOpts {
  /** Twips of space after the paragraph. */
  after?: number;
  before?: number;
  align?: 'left' | 'center' | 'right';
  /** Right-aligned tab stop, for a date sitting opposite a title. */
  rightTab?: number;
  /** Hanging indent, used for bullets. */
  hanging?: number;
  /** A rule above the paragraph, used under section headings. */
  ruleAbove?: string;
  keepNext?: boolean;
}

function para(runs: string, o: ParaOpts = {}): string {
  const props = [
    o.keepNext ? '<w:keepNext/>' : '',
    o.ruleAbove
      ? `<w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="${o.ruleAbove}"/></w:pBdr>`
      : '',
    o.rightTab
      ? `<w:tabs><w:tab w:val="right" w:pos="${o.rightTab}"/></w:tabs>`
      : '',
    o.hanging
      ? `<w:ind w:left="${o.hanging}" w:hanging="${o.hanging}"/>`
      : '',
    `<w:spacing w:before="${o.before ?? 0}" w:after="${o.after ?? 0}"/>`,
    o.align && o.align !== 'left' ? `<w:jc w:val="${o.align}"/>` : '',
  ].join('');
  return `<w:p><w:pPr>${props}</w:pPr>${runs}</w:p>`;
}

const TAB = '<w:r><w:tab/></w:r>';

export const WATERMARK_TEXT = 'Made with Resume Builder by MPS';

function documentXml(resume: Resume, watermark: boolean): string {
  const page = PAGE_TWIPS[resume.style.pageSize] ?? PAGE_TWIPS.A4;
  const tabPos = page.width - MARGIN_TWIPS.left - MARGIN_TWIPS.right;
  const accent = accentHex(resume);
  const b = resume.basics;
  const body: string[] = [];

  body.push(para(run(b.fullName || 'Your name', { bold: true, size: 36 }), { after: 40 }));

  if (b.headline.trim()) {
    body.push(para(run(b.headline, { size: 22, color: GREY }), { after: 60 }));
  }

  const contact = [b.email, b.phone, b.location, ...b.links.map(l => l.label)]
    .filter(v => v && v.trim())
    .join('  ·  ');
  if (contact) {
    body.push(para(run(contact, { size: 18, color: GREY }), { after: 160 }));
  }

  if (resume.summary.trim()) {
    body.push(para(run(resume.summary, { size: 20 }), { after: 160 }));
  }

  const heading = (title: string) =>
    para(run(title, { bold: true, size: 22, color: accent, caps: true }), {
      before: 200,
      after: 100,
      ruleAbove: accent,
      keepNext: true,
    });

  const entry = (title: string, dates: string, sub: string, bullets: string[]) => {
    const out: string[] = [];
    out.push(
      para(
        run(title, { bold: true, size: 20 }) +
          (dates ? TAB + run(dates, { size: 18, color: FAINT }) : ''),
        { rightTab: tabPos, after: 20, keepNext: true },
      ),
    );
    if (sub.trim()) {
      out.push(para(run(sub, { size: 18, color: GREY }), { after: 40, keepNext: true }));
    }
    for (const bullet of bullets.filter(x => x.trim())) {
      // A literal bullet with a hanging indent rather than real Word
      // numbering: numbering.xml is a large part to get right, and an
      // applicant tracking system reads both as the same plain text.
      out.push(
        para(run('•\t' + bullet, { size: 20 }), { hanging: 227, after: 30 }),
      );
    }
    out.push(para('', { after: 80 }));
    return out.join('');
  };

  for (const section of visibleSections(resume)) {
    body.push(heading(section.title));

    switch (section.type) {
      case 'experience':
        for (const i of section.items) {
          body.push(
            entry(
              i.role,
              dateRange(i.startDate, i.endDate, i.current),
              [i.company, i.location].filter(x => x.trim()).join(' · '),
              i.bullets,
            ),
          );
        }
        break;
      case 'education':
        for (const i of section.items) {
          body.push(
            entry(
              i.degree,
              dateRange(i.startDate, i.endDate, i.current),
              [i.institution, i.location, i.score].filter(x => x.trim()).join(' · '),
              i.bullets,
            ),
          );
        }
        break;
      case 'projects':
        for (const i of section.items) {
          body.push(
            entry(
              i.name,
              dateRange(i.startDate, i.endDate, i.current),
              [i.role, i.url].filter(x => x.trim()).join(' · '),
              i.bullets,
            ),
          );
        }
        break;
      case 'custom':
        for (const i of section.items) {
          body.push(
            entry(
              i.title,
              dateRange(i.startDate, i.endDate, i.current),
              i.subtitle,
              i.bullets,
            ),
          );
        }
        break;
      case 'certifications':
        for (const i of section.items) {
          body.push(
            entry(i.name, formatMonth(i.date), [i.issuer, i.url].filter(x => x.trim()).join(' · '), []),
          );
        }
        break;
      case 'skills':
        for (const i of section.items) {
          const values = i.values.filter(v => v.trim()).join(', ');
          if (!values) continue;
          body.push(
            para(
              (i.group.trim() ? run(i.group + ': ', { bold: true, size: 20 }) : '') +
                run(values, { size: 20 }),
              { after: 60 },
            ),
          );
        }
        break;
      case 'languages':
        body.push(
          para(
            run(
              section.items
                .map(i => (i.proficiency.trim() ? `${i.name} (${i.proficiency})` : i.name))
                .join('  ·  '),
              { size: 20 },
            ),
            { after: 60 },
          ),
        );
        break;
    }
  }

  const d = resume.declaration;
  if (d?.enabled) {
    const text = d.text.trim();
    const name = d.signatureName.trim() || b.fullName.trim();
    const date = formatDay(d.date);
    if (text || d.place.trim() || date || name) {
      body.push(heading('Declaration'));
      if (text) body.push(para(run(text, { size: 20 }), { after: 200 }));

      const left = [d.place.trim() ? `Place: ${d.place.trim()}` : '', date ? `Date: ${date}` : '']
        .filter(Boolean)
        .join('        ');
      if (left || name) {
        body.push(
          para(
            run(left, { size: 18 }) + (name ? TAB + run(name, { bold: true, size: 18 }) : ''),
            { rightTab: tabPos, after: 0 },
          ),
        );
      }
    }
  }

  const footerRef = watermark ? '<w:footerReference w:type="default" r:id="rId3"/>' : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body.join(
    '',
  )}<w:sectPr>${footerRef}<w:pgSz w:w="${page.width}" w:h="${page.height}"/><w:pgMar w:top="${MARGIN_TWIPS.top}" w:right="${MARGIN_TWIPS.right}" w:bottom="${MARGIN_TWIPS.bottom}" w:left="${MARGIN_TWIPS.left}" w:header="720" w:footer="600" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

/**
 * The free-tier attribution, as a real page footer. Word repeats a footer on
 * every page and reserves space for it, which is exactly the behaviour the
 * PDF export has to fake with a fixed-position element.
 */
function footerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${para(
    run(WATERMARK_TEXT, { size: 16, color: FAINT }),
    { align: 'right' },
  )}</w:ftr>`;
}

function stylesXml(): string {
  // Only the document defaults. Every visible property is set directly on the
  // runs, so there is no named style for a user to accidentally redefine and
  // no dependency on Word's built-in style names being present.
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="1A1D21"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`;
}

function contentTypesXml(watermark: boolean): string {
  const footer = watermark
    ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
    : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>${footer}</Types>`;
}

function rootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
}

function documentRelsXml(watermark: boolean): string {
  const footer = watermark
    ? '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'
    : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${footer}</Relationships>`;
}

/** The finished .docx as raw bytes. */
export function buildDocx(resume: Resume, opts: { watermark: boolean }): Uint8Array {
  const parts: ZipEntry[] = [
    { name: '[Content_Types].xml', data: utf8(contentTypesXml(opts.watermark)) },
    { name: '_rels/.rels', data: utf8(rootRelsXml()) },
    { name: 'word/document.xml', data: utf8(documentXml(resume, opts.watermark)) },
    { name: 'word/styles.xml', data: utf8(stylesXml()) },
    { name: 'word/_rels/document.xml.rels', data: utf8(documentRelsXml(opts.watermark)) },
  ];
  if (opts.watermark) {
    parts.push({ name: 'word/footer1.xml', data: utf8(footerXml()) });
  }
  return zipStore(parts);
}

export function buildDocxBase64(resume: Resume, opts: { watermark: boolean }): string {
  return toBase64(buildDocx(resume, opts));
}

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
