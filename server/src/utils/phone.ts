import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Normalize a raw phone string to E.164, or return null if invalid.
 * Accepts international format directly (e.g. +91…, +1…) and falls back to
 * common default regions when no country code is present.
 */
export function toE164(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();

  // Explicit international format first.
  const direct = parsePhoneNumberFromString(trimmed);
  if (direct?.isValid()) return direct.number;

  // Fallback: assume a common default region.
  for (const country of ['US', 'IN', 'GB'] as const) {
    const parsed = parsePhoneNumberFromString(trimmed, country);
    if (parsed?.isValid()) return parsed.number;
  }
  return null;
}
