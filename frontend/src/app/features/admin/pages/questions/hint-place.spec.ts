import type { AdminQuestion } from '../../../../core/contracts/admin.contract';
import { placeOf } from './hint-place';

function question(
  id: number,
  correct: number,
  timeouts = 0,
  picks?: number[],
): AdminQuestion {
  const answers = 100;
  return {
    id,
    text: `Frage ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    category: null,
    active: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    stats: {
      answers,
      correct,
      timeouts,
      picks: picks ?? [correct, answers - correct, 0, 0],
      avgAnswerMs: 7000,
      recent: { answers: 0, correct: 0 },
      previous: { answers: 0, correct: 0 },
    },
  };
}

// Five judged questions with 40, 50, 60, 70 and 80 % right answers.
const POOL = [40, 50, 60, 70, 80].map((rate, i) => question(i + 1, rate));

describe('placeOf', () => {
  it('needs a pool of at least five judged questions', () => {
    expect(placeOf('hard', question(9, 22), POOL.slice(0, 4))).toBeNull();
    expect(placeOf('hard', question(9, 22), POOL)).not.toBeNull();
  });

  it('places a hard question below the target range', () => {
    const place = placeOf('hard', question(9, 22), POOL)!;
    expect(place.ownLabel).toBe('22 %');
    expect(place.zone).toEqual({ left: 30, width: 65 });
    expect(place.zoneLabel).toBe('Zielbereich 30–95 % richtig');
    expect(place.gap).toEqual({
      left: 22,
      width: 8,
      text: '8 Punkte unter dem Zielbereich',
    });
    expect(place.place).toBe('Schwerer als 100 % der 5 bewerteten Fragen');
    expect(place.bars).toHaveLength(20);
    expect(place.bars.filter((bar) => bar.own)).toHaveLength(1);
  });

  it('measures timeouts against their own scale', () => {
    const place = placeOf('timeouts', question(9, 50, 35), POOL)!;
    expect(place.max).toBe('40 %');
    expect(place.zoneLabel).toBe('Zielbereich unter 20 % ohne Antwort');
    expect(place.gap?.text).toBe('6 Punkte über dem Zielbereich');
    expect(place.place).toBe('Öfter ohne Antwort als 100 % der 5 bewerteten Fragen');
  });

  it('compares a luring answer with the right one', () => {
    const place = placeOf('lure', question(9, 45, 0, [45, 53, 2, 0]), POOL)!;
    expect(place.zoneLabel).toBe('Zielbereich unter der richtigen (45 %)');
    expect(place.gap?.text).toBe('8 Punkte über der richtigen');
    expect(place.place).toBe('Lockt stärker als bei 80 % der 5 bewerteten Fragen');
  });

  it('has no gap inside the target range', () => {
    expect(placeOf('easy', question(9, 60), POOL)?.gap).toBeNull();
  });
});
