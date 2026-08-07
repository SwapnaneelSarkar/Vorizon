import { parse as parseCsv } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import type {
  ContactDTO,
  ContactImportResult,
  CreateContactInput,
  ValidationStatus,
} from '@vorizon/shared';
import { Contact, type ContactDoc } from '../../models/Contact.js';
import { toE164 } from '../../utils/phone.js';

type ContactRecord = ContactDoc & { _id: unknown };

function toDTO(c: ContactRecord): ContactDTO {
  return {
    id: String(c._id),
    name: c.name,
    phone: c.phone,
    email: c.email || undefined,
    company: c.company || undefined,
    tags: c.tags ?? [],
    notes: c.notes || undefined,
    campaignId: c.campaignId ? String(c.campaignId) : undefined,
    validationStatus: c.validationStatus,
    optedOut: c.optedOut ?? false,
    createdAt: (c as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}

/** Normalize & validate a phone to E.164. Returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  return toE164(raw);
}

export async function createContact(
  orgId: string,
  input: CreateContactInput,
): Promise<ContactDTO> {
  const e164 = normalizePhone(input.phone);
  const contact = (await Contact.create({
    organizationId: orgId,
    name: input.name,
    phone: e164 ?? input.phone,
    email: input.email || '',
    company: input.company || '',
    tags: input.tags ?? [],
    notes: input.notes || '',
    validationStatus: (e164 ? 'valid' : 'invalid') as ValidationStatus,
  })) as ContactRecord;
  return toDTO(contact);
}

function rowsFromBuffer(buffer: Buffer, mime: string, name: string): Record<string, string>[] {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (mime === 'text/csv' || ext === 'csv') {
    return parseCsv(buffer.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  }
  // xlsx / xls
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, string>[];
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const key of Object.keys(row)) {
    if (keys.includes(key.toLowerCase().trim())) return String(row[key] ?? '').trim();
  }
  return '';
}

export async function importContacts(
  orgId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string },
): Promise<ContactImportResult> {
  const rows = rowsFromBuffer(file.buffer, file.mimetype, file.originalname);
  const invalid: ContactImportResult['invalid'] = [];
  const toInsert: Record<string, unknown>[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // header is row 1
    const name = pick(row, ['name', 'customer name', 'full name', 'contact']);
    const phoneRaw = pick(row, ['phone', 'phone number', 'mobile', 'number']);
    const email = pick(row, ['email', 'e-mail']);
    const company = pick(row, ['company', 'organization']);
    const tags = pick(row, ['tags']);
    const notes = pick(row, ['notes', 'note']);

    if (!phoneRaw) {
      invalid.push({ row: rowNum, reason: 'Missing phone number' });
      return;
    }
    const e164 = normalizePhone(phoneRaw);
    if (!e164) {
      invalid.push({ row: rowNum, reason: 'Invalid phone number', value: phoneRaw });
      return;
    }
    toInsert.push({
      organizationId: orgId,
      name: name || 'Unknown',
      phone: e164,
      email,
      company,
      tags: tags ? tags.split(/[;,]/).map((t) => t.trim()).filter(Boolean) : [],
      notes,
      validationStatus: 'valid',
    });
  });

  if (toInsert.length) await Contact.insertMany(toInsert);
  return { imported: toInsert.length, invalid };
}

export async function listContacts(
  orgId: string,
  filter: { campaignId?: string; validationStatus?: string; page: number; limit: number },
) {
  const query: Record<string, unknown> = { organizationId: orgId };
  if (filter.campaignId) query.campaignId = filter.campaignId;
  if (filter.validationStatus) query.validationStatus = filter.validationStatus;

  const [items, total] = await Promise.all([
    Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((filter.page - 1) * filter.limit)
      .limit(filter.limit),
    Contact.countDocuments(query),
  ]);
  return {
    items: items.map((c) => toDTO(c as ContactRecord)),
    total,
    page: filter.page,
    limit: filter.limit,
  };
}

export async function deleteContact(orgId: string, id: string) {
  await Contact.deleteOne({ _id: id, organizationId: orgId });
}
