import {
  change,
  formatClock,
  formatDuration,
  formatPercent,
  formatRelative,
} from './format';

describe('format', () => {
  it('formats shares and changes', () => {
    expect(formatPercent(0.734)).toBe('73 %');
    expect(formatPercent(null)).toBe('–');
    expect(change(120, 100)).toBeCloseTo(0.2);
    expect(change(5, 0)).toBeNull();
  });

  it('formats durations', () => {
    expect(formatDuration(42_000)).toBe('42 s');
    expect(formatDuration(252_000)).toBe('4:12 Min.');
    expect(formatClock(65_400)).toBe('1:05');
    expect(formatDuration(null)).toBe('–');
  });

  it('describes recent times in words', () => {
    const now = Date.parse('2026-10-22T12:00:00Z');
    expect(formatRelative(now - 10_000, now)).toBe('gerade eben');
    expect(formatRelative(now - 5 * 60_000, now)).toBe('vor 5 Min.');
    expect(formatRelative(now - 2 * 3_600_000, now)).toBe('vor 2 Std.');
  });
});
