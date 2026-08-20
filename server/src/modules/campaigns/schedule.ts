/**
 * Calling-hours (working-hours) evaluation for campaigns. A campaign only dials
 * when the current time in its configured timezone falls on an allowed weekday
 * and inside the [start, end) window — a TCPA calling-hours requirement once
 * real telephony is enabled.
 */

export interface CallingSchedule {
  tz?: string;
  /** Allowed weekdays, 0 = Sunday … 6 = Saturday. Empty = every day. */
  days?: number[];
  /** "HH:MM" 24-hour, inclusive lower bound. */
  start?: string;
  /** "HH:MM" 24-hour, exclusive upper bound. */
  end?: string;
}

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function partsInZone(tz: string, date: Date): { weekday: number; hm: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  let hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  // Some ICU builds render midnight as '24' with hour12:false — normalize to 00.
  if (hour === '24') hour = '00';
  return { weekday: WEEKDAY[wd] ?? 1, hm: `${hour}:${minute}` };
}

/**
 * True when `date` is inside the schedule's allowed calling window. Falls back
 * to UTC on an invalid/typo timezone so a bad config can never throw and abort
 * a run (it just evaluates in UTC).
 */
export function withinWindow(schedule: CallingSchedule | undefined, date: Date = new Date()): boolean {
  const tz = schedule?.tz || 'UTC';
  const days = schedule?.days ?? [1, 2, 3, 4, 5];
  const start = schedule?.start || '09:00';
  const end = schedule?.end || '17:00';

  let info: { weekday: number; hm: string };
  try {
    info = partsInZone(tz, date);
  } catch {
    info = partsInZone('UTC', date);
  }

  // Empty allowed-days list is treated as "every day" so a misconfigured empty
  // schedule can't silently make a campaign never dial.
  if (days.length > 0 && !days.includes(info.weekday)) return false;
  // Zero-padded HH:MM compares correctly as strings.
  return info.hm >= start && info.hm < end;
}
