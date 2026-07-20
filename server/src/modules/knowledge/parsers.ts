import mammoth from 'mammoth';
import { parse as parseCsv } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

/** Extract plain text from an uploaded file buffer based on mime/extension. */
export async function extractText(
  buffer: Buffer,
  mime: string,
  originalName: string,
): Promise<string> {
  const ext = originalName.toLowerCase().split('.').pop() ?? '';

  if (mime === 'application/pdf' || ext === 'pdf') {
    // pdf-parse is CommonJS; import lazily to avoid its debug-mode side effects.
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mime === 'text/csv' || ext === 'csv') {
    const rows = parseCsv(buffer.toString('utf8'), { skip_empty_lines: true }) as string[][];
    return rows.map((r) => r.join(', ')).join('\n');
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel' ||
    ext === 'xlsx' ||
    ext === 'xls'
  ) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    return wb.SheetNames.map((name) => XLSX.utils.sheet_to_csv(wb.Sheets[name])).join('\n');
  }

  // Fallback: treat as UTF-8 text (txt and unknown).
  return buffer.toString('utf8').trim();
}

/** Naive fixed-size chunker (Phase 1). Phase 2 adds embeddings per chunk. */
export function chunkText(text: string, maxChars = 1200): { text: string }[] {
  const clean = text.replace(/\s+\n/g, '\n').trim();
  if (!clean) return [];
  const chunks: { text: string }[] = [];
  const paragraphs = clean.split(/\n{2,}/);
  let current = '';
  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars && current) {
      chunks.push({ text: current.trim() });
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push({ text: current.trim() });
  return chunks;
}
