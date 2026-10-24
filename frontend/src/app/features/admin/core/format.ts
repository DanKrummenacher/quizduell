// Number, time and date formats of the admin, all Swiss German (de-CH).

const integer = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('de-CH', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dateTime = new Intl.DateTimeFormat('de-CH', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Zurich',
});
const time = new Intl.DateTimeFormat('de-CH', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Zurich',
});
const timeSeconds = new Intl.DateTimeFormat('de-CH', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'Europe/Zurich',
});
const dayMonth = new Intl.DateTimeFormat('de-CH', {
  day: 'numeric',
  month: 'numeric',
  timeZone: 'UTC',
});
const weekdayShort = new Intl.DateTimeFormat('de-CH', {
  weekday: 'short',
  timeZone: 'UTC',
});
const longDay = new Intl.DateTimeFormat('de-CH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/** 1’234 */
export function formatInt(value: number): string {
  return integer.format(value);
}

/** 1’234 → 1,2 Tsd. for tight places. */
export function formatCompact(value: number): string {
  return value >= 10_000
    ? `${integer.format(Math.round(value / 1000))} Tsd.`
    : integer.format(value);
}

/** 0.734 → «73 %», null → «–». */
export function formatPercent(share: number | null, digits = 0): string {
  if (share === null || !Number.isFinite(share)) {
    return '–';
  }
  const value = share * 100;
  return `${digits ? oneDecimal.format(value) : integer.format(value)} %`;
}

/** Share of `part` in `total`, null without a total. */
export function share(part: number, total: number): number | null {
  return total > 0 ? part / total : null;
}

/** 8’400 ms → «8,4 s». */
export function formatSeconds(ms: number | null): string {
  return ms === null ? '–' : `${oneDecimal.format(ms / 1000)} s`;
}

/** 252’000 ms → «4:12 Min.», 42’000 → «42 s». */
export function formatDuration(ms: number | null): string {
  if (ms === null) {
    return '–';
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds} s`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')} Min.`;
}

/** Seconds as a running clock: «0:42», «12:05». */
export function formatClock(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/** «vor 3 Min.», «gestern, 14:05», «12.10.2026, 09:30». */
export function formatRelative(at: string | number, now = Date.now()): string {
  const date = new Date(at);
  const seconds = Math.round((now - date.getTime()) / 1000);
  if (seconds < 45) {
    return 'gerade eben';
  }
  if (seconds < 3600) {
    return `vor ${Math.max(1, Math.round(seconds / 60))} Min.`;
  }
  if (seconds < 6 * 3600) {
    const hours = Math.round(seconds / 3600);
    return `vor ${hours} Std.`;
  }
  const today = dayKey(new Date(now));
  const yesterday = dayKey(new Date(now - 86_400_000));
  if (dayKey(date) === today) {
    return `heute, ${time.format(date)}`;
  }
  if (dayKey(date) === yesterday) {
    return `gestern, ${time.format(date)}`;
  }
  return dateTime.format(date);
}

export function formatDateTime(at: string | number): string {
  return dateTime.format(new Date(at));
}

export function formatTime(at: number, seconds = false): string {
  return (seconds ? timeSeconds : time).format(new Date(at));
}

/** `2026-10-21` → «21.10.» */
export function formatDay(day: string): string {
  return dayMonth.format(new Date(`${day}T12:00:00Z`));
}

/** `2026-10-21` → «Mi 21.10.» */
export function formatWeekday(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  return `${weekdayShort.format(date).replace('.', '')} ${dayMonth.format(date)}`;
}

/** `2026-10-21` → «Mittwoch, 21. Oktober» */
export function formatLongDay(day: string): string {
  return longDay.format(new Date(`${day}T12:00:00Z`));
}

/** Calendar day in Zurich as `YYYY-MM-DD`. */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(
    date,
  );
}

/** Change from `previous` to `current` as a share, null without a base. */
export function change(current: number, previous: number): number | null {
  return previous > 0 ? (current - previous) / previous : null;
}

/** «F-12» */
export function questionCode(id: number): string {
  return `F-${id}`;
}

/** «1 Frage», «3 Fragen» */
export function plural(count: number, one: string, many: string): string {
  return `${formatInt(count)} ${count === 1 ? one : many}`;
}
