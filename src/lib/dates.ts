export const CAIRO_TIME_ZONE = "Africa/Cairo";

type CairoParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function cairoParts(date: Date): CairoParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour") % 24,
    minute: value("minute"),
    second: value("second"),
  };
}

/**
 * The UTC instant for 00:00 in Cairo, N calendar days ago.
 * Handles Egypt's DST offset without adding a date library.
 */
export function cairoStartOfDay(daysAgo = 0) {
  const now = new Date();
  const today = cairoParts(now);
  const guess = new Date(Date.UTC(today.year, today.month - 1, today.day - daysAgo, 0, 0, 0));
  const wall = cairoParts(guess);
  const wallAsUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  const offset = wallAsUtc - guess.getTime();
  return new Date(guess.getTime() - offset);
}

/** Short Arabic weekday for a Cairo calendar day. */
export function cairoWeekday(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "short",
    timeZone: CAIRO_TIME_ZONE,
  }).format(date);
}
