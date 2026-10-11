// The package exports a named generatePDF and has no default export. Importing
// a default silently yields undefined, which only shows up at run time as
// "cannot read property 'convert' of undefined" when the user taps export.
import { generatePDF } from 'react-native-html-to-pdf';
import { Resume } from '../types/resume';
import { getTemplate, renderResume } from '../templates/registry';
import { PAGE_POINTS } from '../templates/base';
import { DOCX_MIME, buildDocxBase64 } from './docx';
import { saveToDownloads, writeTempFile } from './downloads';

export type Entitlement = 'free' | 'pro';

export type ExportFormat = 'pdf' | 'docx';

export const PDF_MIME = 'application/pdf';

export const FORMAT_LABEL: Record<ExportFormat, string> = {
  pdf: 'PDF',
  docx: 'Word',
};

export function formatMime(format: ExportFormat): string {
  return format === 'pdf' ? PDF_MIME : DOCX_MIME;
}

export function formatExtension(format: ExportFormat): string {
  return format === 'pdf' ? 'pdf' : 'docx';
}

export type ExportRefusal =
  | { ok: false; reason: 'premium-template'; templateName: string }
  | { ok: false; reason: 'free-exports-used'; used: number; allowance: number }
  | { ok: false; reason: 'render-failed'; message: string };

export type ExportResult =
  | {
      ok: true;
      filePath: string;
      format: ExportFormat;
      mimeType: string;
      watermarked: boolean;
      /**
       * Where to tell the user the file is, e.g. "Downloads/Jane_Doe.pdf".
       * Null when it could only be written to the app's own folder, which
       * the user cannot browse to.
       */
      savedTo: string | null;
    }
  | ExportRefusal;

/**
 * Free users get real, usable files — the export is watermarked, not blocked.
 * Blocking export outright is what makes people fill twenty fields and then
 * uninstall. Premium templates are the thing that is actually locked.
 */
export const FREE_EXPORT_ALLOWANCE = 3;

export interface ExportParams {
  resume: Resume;
  entitlement: Entitlement;
  /** Count of free exports already consumed, from local billing state. */
  freeExportsUsed: number;
  format: ExportFormat;
}

export function safeFileName(resume: Resume): string {
  const raw = resume.basics.fullName || resume.title || 'resume';
  const slug = raw
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);
  return slug || 'resume';
}

/**
 * Whether this export is allowed, and if not, why.
 *
 * Separated from the writing so both formats are gated identically and the
 * rules can be tested without a device. The premium-template check applies
 * only to PDF: a .docx is one canonical Word layout that ignores the chosen
 * design entirely, so refusing it would withhold a file that never contained
 * the paid design in the first place.
 */
export function checkExportAllowed(
  params: Pick<ExportParams, 'resume' | 'entitlement' | 'freeExportsUsed' | 'format'>,
): ExportRefusal | null {
  const { resume, entitlement, freeExportsUsed, format } = params;
  if (entitlement === 'pro') return null;

  const template = getTemplate(resume.templateId);
  if (format === 'pdf' && template.tier === 'premium') {
    return { ok: false, reason: 'premium-template', templateName: template.name };
  }
  if (freeExportsUsed >= FREE_EXPORT_ALLOWANCE) {
    return {
      ok: false,
      reason: 'free-exports-used',
      used: freeExportsUsed,
      allowance: FREE_EXPORT_ALLOWANCE,
    };
  }
  return null;
}

export async function exportResume(params: ExportParams): Promise<ExportResult> {
  const { resume, entitlement, format } = params;

  const refusal = checkExportAllowed(params);
  if (refusal) return refusal;

  const watermarked = entitlement !== 'pro';
  const name = safeFileName(resume);
  const fileName = `${name}.${formatExtension(format)}`;
  const mimeType = formatMime(format);

  try {
    const filePath =
      format === 'pdf'
        ? await writePdf(resume, name, watermarked)
        : await writeTempFile(fileName, buildDocxBase64(resume, { watermark: watermarked }));

    if (!filePath) {
      return { ok: false, reason: 'render-failed', message: 'No file was produced.' };
    }

    // Both converters can only write inside the app's own directories, which
    // Android 11 hid from every file manager. Copy it somewhere the user can
    // actually find. A failure here leaves a perfectly good file behind, so
    // it downgrades the message rather than failing the export.
    const savedTo = await saveToDownloads(filePath, fileName, mimeType);

    return { ok: true, filePath, format, mimeType, watermarked, savedTo };
  } catch (e: any) {
    return {
      ok: false,
      reason: 'render-failed',
      message: e?.message ?? 'The file could not be generated.',
    };
  }
}

async function writePdf(
  resume: Resume,
  name: string,
  watermarked: boolean,
): Promise<string | undefined> {
  const html = renderResume(resume, { mode: 'export', watermark: watermarked });
  // Points, not the 96dpi CSS pixels the templates lay out in — the converter
  // reads width and height as points when it builds the paper size.
  const page = PAGE_POINTS[resume.style.pageSize];

  const file = await generatePDF({
    html,
    fileName: name,
    directory: 'Documents',
    width: page.width,
    height: page.height,
    // No padding option is passed: the Android module does not read one.
    // Print margins come from the template's @page rule, which is the only
    // thing the print engine applies to every sheet.
  });

  return file?.filePath;
}

/** Copy shown in the UI when an export is refused. */
export function refusalCopy(r: ExportRefusal): { title: string; body: string; cta: string } {
  switch (r.reason) {
    case 'premium-template':
      return {
        title: `${r.templateName} is a Pro design`,
        body: 'Switch to a free design to export now, or unlock all 100+ designs with Pro.',
        cta: 'See Pro',
      };
    case 'free-exports-used':
      return {
        title: `You've used your ${r.allowance} free exports`,
        body: 'Pro removes the export limit and the watermark, and turns off ads.',
        cta: 'See Pro',
      };
    case 'render-failed':
      return {
        title: 'Export failed',
        body: `${r.message} Your resume is saved — try again.`,
        cta: 'Try again',
      };
  }
}
