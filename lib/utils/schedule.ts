// America/Belize is a fixed UTC-6 offset year-round (no DST), per the
// Phase 0 architecture decision. "Today" must mean the same calendar day
// in Belize regardless of what timezone this server happens to run in -
// so day boundaries are computed explicitly against this offset, never
// against the server's local Date semantics.
const FACILITY_UTC_OFFSET_HOURS = 6; // Belize local time = UTC - 6

/**
 * The [start, end) UTC instant range covering one facility-local calendar
 * day. daysOffset 0 = today, 1 = tomorrow, etc. (Belize local "today").
 */
export function getFacilityDayRange(daysOffset: number): { start: Date; end: Date } {
  const utcNow = new Date();
  // Shift the clock back by the offset so its UTC-labeled Y/M/D fields
  // read as Belize's local calendar date.
  const shifted = new Date(utcNow.getTime() - FACILITY_UTC_OFFSET_HOURS * 3600_000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate() + daysOffset;

  // Midnight Belize-local on that date, expressed as its real UTC instant
  // (add the offset back).
  const start = new Date(Date.UTC(year, month, day, FACILITY_UTC_OFFSET_HOURS, 0, 0, 0));
  const end = new Date(start.getTime() + 24 * 3600_000);
  return { start, end };
}

/**
 * Interprets a naive "YYYY-MM-DDTHH:mm" string (what an HTML
 * datetime-local input produces - no timezone attached) as facility-local
 * (Belize) wall-clock time, not the server's own local timezone. This
 * matters because the server's OS timezone has no relationship to Belize -
 * `new Date(naiveString)` would silently use whatever timezone the server
 * happens to run in, which is wrong regardless of what that happens to be.
 */
export function parseFacilityLocalDateTime(naive: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(naive);
  if (!match) return new Date(NaN);
  const [, y, mo, d, h, mi] = match.map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h + FACILITY_UTC_OFFSET_HOURS, mi, 0, 0));
}
