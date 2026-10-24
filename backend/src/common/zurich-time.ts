/** The admin reports days and hours in the time zone of the operator. */
export const TIME_ZONE = 'Europe/Zurich';

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  hour: '2-digit',
  hourCycle: 'h23',
});

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Calendar day as `YYYY-MM-DD` in Zurich. */
export function zurichDay(date: Date = new Date()): string {
  return dayFormat.format(date);
}

/** Weekday (0 = Monday) and hour (0–23) in Zurich. */
export function zurichWeekdayHour(date: Date): { weekday: number; hour: number } {
  const parts = partsFormat.formatToParts(date);
  const weekday = WEEKDAYS.indexOf(parts.find((p) => p.type === 'weekday')!.value);
  const hour = Number(parts.find((p) => p.type === 'hour')!.value);
  return { weekday, hour };
}

/** The `count` calendar days ending with `end`, oldest first. */
export function lastDays(count: number, end: Date = new Date()): string[] {
  const days: string[] = [];
  // Noon avoids skipping or doubling a day around daylight saving changes.
  const cursor = new Date(`${zurichDay(end)}T12:00:00Z`);
  for (let i = count - 1; i >= 0; i--) {
    days.push(zurichDay(new Date(cursor.getTime() - i * 86_400_000)));
  }
  return days;
}

/** The instant a Zurich calendar day (`YYYY-MM-DD`) begins. */
export function zurichMidnight(day: string): Date {
  const utcMidnight = Date.parse(`${day}T00:00:00Z`);
  for (const offsetHours of [1, 2]) {
    const candidate = new Date(utcMidnight - offsetHours * 3_600_000);
    if (zurichDay(candidate) === day && zurichWeekdayHour(candidate).hour === 0) {
      return candidate;
    }
  }
  return new Date(utcMidnight);
}
