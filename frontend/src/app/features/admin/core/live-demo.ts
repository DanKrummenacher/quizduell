import { signal } from '@angular/core';
import { sessionStore } from '../../../core/platform/safe-storage';
import type {
  LiveDuel,
  LiveEvent,
  LiveRound,
  LiveSnapshot,
} from '../../../core/contracts/admin.contract';

/**
 * Temporary: sample data for the live drafts, to compare a quiet and a busy
 * moment. Removed again with the facelift drafts.
 */
export type LiveData = 'real' | 'empty' | 'busy' | 'crowd';

const KEY = 'playduelio.admin.facelift.data';

export const LIVE_DATA: { id: LiveData; name: string }[] = [
  { id: 'busy', name: 'Viel los' },
  { id: 'crowd', name: 'Andrang' },
  { id: 'empty', name: 'Leer' },
  { id: 'real', name: 'Server' },
];

export const liveData = signal<LiveData>(
  (sessionStore.get(KEY) as LiveData | null) ?? 'busy',
);

export function setLiveData(data: LiveData): void {
  sessionStore.set(KEY, data);
  liveData.set(data);
}

/** The snapshot as the chosen sample shows it. */
export function demoLive(real: LiveSnapshot): LiveSnapshot {
  if (sessionStore.get('playduelio.admin.facelift') === null) {
    return real;
  }
  switch (liveData()) {
    case 'real':
      return real;
    case 'empty':
      return {
        ...real,
        duels: [],
        searching: [],
        waiting: [],
        events: [],
        history: real.history.map((sample) => ({ ...sample, games: 0, players: 0 })),
        peak: null,
      };
    case 'busy':
      return { ...busy(real.serverNow), paused: real.paused };
    case 'crowd':
      return { ...crowd(busy(real.serverNow)), paused: real.paused };
  }
}

const NAMES = [
  ['Anna', 'Ben'],
  ['Chiara', 'David'],
  ['Elena', 'Fabio'],
  ['Gina', 'Hannes'],
  ['Ilaria', 'Jonas'],
  ['Kim', 'Leon'],
  ['Mara', 'Nico'],
  ['Olivia', 'Pascal'],
  ['Rahel', 'Samuel'],
  ['Tina', 'Urs'],
] as const;

const QUESTIONS: { text: string; options: string[]; correct: number }[] = [
  {
    text: 'Wie viele Kantone hat die Schweiz?',
    options: ['24', '25', '26', '27'],
    correct: 2,
  },
  {
    text: 'Wofür steht die Abkürzung CPU?',
    options: [
      'Central Processing Unit',
      'Computer Power Unit',
      'Core Program Utility',
      'Central Print Unit',
    ],
    correct: 0,
  },
  {
    text: 'An welchem See liegt die Stadt Luzern?',
    options: ['Zürichsee', 'Vierwaldstättersee', 'Thunersee', 'Bodensee'],
    correct: 1,
  },
  {
    text: 'Welche Zahl folgt? 1, 1, 2, 3, 5, 8, ?',
    options: ['11', '12', '13', '14'],
    correct: 2,
  },
  {
    text: 'Wie viele Minuten hat ein Tag?',
    options: ['1240', '1440', '1640', '1840'],
    correct: 1,
  },
  {
    text: 'Welches Gas atmen Pflanzen bei der Fotosynthese ein?',
    options: ['Sauerstoff', 'Stickstoff', 'Kohlendioxid', 'Helium'],
    correct: 2,
  },
  {
    text: 'Wer malte die Mona Lisa?',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raffael', 'Tizian'],
    correct: 1,
  },
  {
    text: 'Welcher Planet ist der Sonne am nächsten?',
    options: ['Venus', 'Mars', 'Merkur', 'Erde'],
    correct: 2,
  },
  {
    text: 'Welche Dezimalzahl entspricht der Binärzahl 1010?',
    options: ['8', '10', '12', '14'],
    correct: 1,
  },
  {
    text: 'Wie heisst der höchste Berg der Schweiz?',
    options: ['Matterhorn', 'Dufourspitze', 'Eiger', 'Jungfrau'],
    correct: 1,
  },
  {
    text: 'Wie viele Knochen hat ein erwachsener Mensch ungefähr?',
    options: ['106', '206', '306', '406'],
    correct: 1,
  },
];

const TOTAL = 7;
const COUNTDOWN = 3;
const QUESTION = 20;
const REVEAL = 4;
const AFTER = 9;
const PERIOD = COUNTDOWN + TOTAL * (QUESTION + REVEAL) + AFTER;
const SLOTS = 7;
const EPOCH = Date.UTC(2026, 0, 1);

/** Stable pseudo random number in [0, 1). */
function rand(...seed: number[]): number {
  let h = 2166136261;
  for (const n of seed) {
    h = Math.imul(h ^ n, 16777619);
    h ^= h >>> 13;
  }
  return ((h >>> 0) % 10000) / 10000;
}

function codeOf(slot: number, cycle: number): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, (_, i) =>
    letters.charAt(Math.floor(rand(slot, cycle, i, 7) * letters.length)),
  ).join('');
}

interface SlotState {
  duel: LiveDuel;
  start: number;
  end: number;
  aborted: boolean;
}

/** The duel of one slot in one cycle, as it stands at `now`. */
function slotAt(slot: number, cycle: number, now: number): SlotState {
  const offset = slot * 11_300;
  const start = EPOCH + offset + cycle * PERIOD * 1000;
  const pair = NAMES[(slot + cycle * SLOTS) % NAMES.length]!;
  const e = Math.max(0, (now - start) / 1000);
  const aborted = rand(slot, cycle, 99) < 0.12;
  const abortAt = 2 + Math.floor(rand(slot, cycle, 98) * 4);
  const lostPlayer = slot === 3 && cycle % 2 === 0;

  let phase: LiveDuel['phase'] = 'countdown';
  let done = 0;
  let phaseEndsAt: number | null = start + COUNTDOWN * 1000;
  let within = 0;
  if (e >= COUNTDOWN) {
    const q = Math.floor((e - COUNTDOWN) / (QUESTION + REVEAL));
    within = (e - COUNTDOWN) % (QUESTION + REVEAL);
    const qStart = start + (COUNTDOWN + q * (QUESTION + REVEAL)) * 1000;
    if (q >= TOTAL) {
      phase = 'finished';
      done = TOTAL;
      phaseEndsAt = null;
    } else if (within < QUESTION) {
      phase = 'question';
      done = q;
      phaseEndsAt = qStart + QUESTION * 1000;
    } else {
      phase = 'reveal';
      done = q + 1;
      phaseEndsAt = qStart + (QUESTION + REVEAL) * 1000;
    }
  }
  if (aborted && done >= abortAt) {
    done = abortAt;
    phase = 'aborted';
  }

  const rounds: LiveRound[] = [];
  const scores = [0, 0];
  for (let q = 0; q < done; q++) {
    const question = QUESTIONS[(slot * 5 + cycle * 3 + q) % QUESTIONS.length]!;
    const answers = [0, 1].map((p) => {
      const right = rand(slot, cycle, q, p) < (p === 0 ? 0.62 : 0.55);
      const ms = 1500 + Math.floor(rand(slot, cycle, q, p, 3) * 15_000);
      const none = rand(slot, cycle, q, p, 5) < 0.06;
      const index = none
        ? null
        : right
          ? question.correct
          : (question.correct + 1 + Math.floor(rand(slot, cycle, q, p, 4) * 3)) % 4;
      const points =
        index === question.correct
          ? Math.round(100 + 100 * (1 - ms / (QUESTION * 1000)))
          : 0;
      scores[p]! += points;
      return { index, ms: none ? null : ms, points };
    });
    rounds.push({
      questionId: q + 1,
      text: question.text,
      options: question.options,
      correctIndex: question.correct,
      answers,
    });
  }
  const current =
    phase === 'question' || phase === 'reveal'
      ? QUESTIONS[
          (slot * 5 + cycle * 3 + (phase === 'question' ? done : done - 1)) %
            QUESTIONS.length
        ]!
      : null;
  const answeredAt = [0, 1].map((p) => 2 + rand(slot, cycle, done, p, 3) * 15);
  const duel: LiveDuel = {
    code: codeOf(slot, cycle),
    mode: slot >= 5 ? 'friend' : 'quick',
    phase,
    players: [0, 1].map((p) => ({
      name: pair[p]!,
      score: scores[p]!,
      connected: !(lostPlayer && p === 1 && done >= 3 && phase !== 'finished'),
      answered: phase === 'question' && within > answeredAt[p]!,
    })),
    questionNumber: phase === 'question' ? done + 1 : Math.max(1, done),
    totalQuestions: TOTAL,
    currentQuestion: current?.text ?? null,
    phaseEndsAt,
    startedAt: start,
    rematch: cycle % 3 !== 0,
    rounds,
  };
  const end = aborted
    ? start + (COUNTDOWN + abortAt * (QUESTION + REVEAL)) * 1000
    : start + (COUNTDOWN + TOTAL * (QUESTION + REVEAL)) * 1000;
  return { duel, start, end, aborted };
}

function busy(now: number): LiveSnapshot {
  const duels: LiveDuel[] = [];
  const events: LiveEvent[] = [];
  for (let slot = 0; slot < SLOTS; slot++) {
    const cycle = Math.floor((now - EPOCH - slot * 11_300) / (PERIOD * 1000));
    // Slot 6 rests every other cycle, so the count moves.
    const resting = slot === 6 && cycle % 2 === 1;
    if (!resting) {
      const state = slotAt(slot, cycle, now);
      if (state.duel.phase !== 'aborted' && now < state.end + AFTER * 1000) {
        duels.push(state.duel);
      }
    }
    for (let k = cycle; k > cycle - 6; k--) {
      if (slot === 6 && k % 2 === 1) {
        continue;
      }
      const past = slotAt(slot, k, now);
      const [a, b] = past.duel.players;
      const names = [a!.name, b!.name];
      const base = { code: past.duel.code, mode: past.duel.mode, names };
      if (past.start <= now) {
        events.push({
          ...base,
          id: slot * 1e6 + k * 10 + 1,
          at: past.start,
          kind:
            past.duel.mode === 'friend'
              ? 'joined'
              : past.duel.rematch
                ? 'rematch'
                : 'matched',
        });
      }
      if (past.end <= now) {
        events.push(
          past.aborted
            ? {
                ...base,
                id: slot * 1e6 + k * 10 + 2,
                at: past.end,
                kind: 'aborted',
                reason:
                  rand(slot, k, 9) < 0.5 ? 'opponent-left' : 'opponent-disconnected',
              }
            : {
                ...base,
                id: slot * 1e6 + k * 10 + 2,
                at: past.end,
                kind: 'finished',
                scores: [a!.score, b!.score],
              },
        );
      }
    }
  }
  events.sort((x, y) => y.at - x.at);
  const minute = Math.floor(now / 60_000) * 60_000;
  const history = Array.from({ length: 60 }, (_, i) => {
    const at = minute - (59 - i) * 60_000;
    const games =
      i === 59
        ? duels.filter((d) => d.phase !== 'finished').length
        : Math.max(0, Math.round(4 + 2.4 * Math.sin(i / 7) + rand(i, 1) * 2.2));
    return { at, games, players: games * 2 };
  });
  const top = history.reduce(
    (best, s) => (s.games > best.games ? s : best),
    history[0]!,
  );
  return {
    serverNow: now,
    since: now - 3 * 3_600_000,
    duels: duels.sort((x, y) => y.startedAt - x.startedAt),
    searching: [
      { name: 'Luca', since: now - ((now / 1000) % 40) * 1000 },
      { name: 'Vera', since: now - 4000 - ((now / 1000) % 9) * 1000 },
    ],
    waiting: [
      { code: 'M7QX', name: 'Mia', since: now - 154_000 },
      { code: 'R2TB', name: 'Robin', since: now - 38_000 },
    ],
    events: events.slice(0, 60),
    history,
    peak: { games: top.games, at: top.at },
    paused: false,
  };
}

const QUEUE = [
  'Luca',
  'Vera',
  'Noah',
  'Lea',
  'Elias',
  'Mila',
  'Jan',
  'Sofia',
  'Tim',
  'Nina',
  'Aaron',
];
const CODES = [
  ['M7QX', 'Mia'],
  ['R2TB', 'Robin'],
  ['K9PL', 'Selin'],
  ['W4HD', 'Jakob'],
  ['T8NZ', 'Lara'],
];

/** A rush hour: many waiting for an opponent, several codes open. */
function crowd(snapshot: LiveSnapshot): LiveSnapshot {
  const now = snapshot.serverNow;
  // Each one waits a different stretch, then starts over.
  const searching = QUEUE.map((name, i) => {
    const span = 40 + i * 9;
    const waited = ((now / 1000 + i * 17) % span) * 1000;
    return { name, since: now - waited };
  });
  const waiting = CODES.map(([code, name], i) => ({
    code: code!,
    name: name!,
    since: now - (24_000 + i * 71_000 + ((now / 1000) % 60) * 1000),
  }));
  return { ...snapshot, searching, waiting };
}

/** Temporary: how the duels and the queue are shown in the «Baukasten» draft. */
export const DUEL_VIEWS = [
  { id: 'table', name: 'Tabelle' },
  { id: 'list', name: 'Liste + Detail' },
  { id: 'raster', name: 'Raster' },
  { id: 'stage', name: 'Bühne' },
  { id: 'lane', name: 'Spur' },
  { id: 'dense', name: 'Kompakt' },
  { id: 'scoreboard', name: 'Anzeigetafel' },
  { id: 'phase', name: 'Nach Phase' },
] as const;

export const WAIT_VIEWS = [
  { id: 'list', name: 'Liste' },
  { id: 'queue', name: 'Schlange' },
  { id: 'bars', name: 'Zeitbalken' },
  { id: 'faces', name: 'Gesichter' },
  { id: 'summary', name: 'Übersicht' },
] as const;

export type DuelView = (typeof DUEL_VIEWS)[number]['id'];
export type WaitView = (typeof WAIT_VIEWS)[number]['id'];

const DUEL_KEY = 'playduelio.admin.facelift.duels';
const WAIT_KEY = 'playduelio.admin.facelift.wait';

export const duelView = signal<DuelView>(
  (sessionStore.get(DUEL_KEY) as DuelView | null) ?? 'lane',
);
export const waitView = signal<WaitView>(
  (sessionStore.get(WAIT_KEY) as WaitView | null) ?? 'list',
);

export function setDuelView(view: DuelView): void {
  sessionStore.set(DUEL_KEY, view);
  duelView.set(view);
}

export function setWaitView(view: WaitView): void {
  sessionStore.set(WAIT_KEY, view);
  waitView.set(view);
}

/** Temporary: how the table/grid choice, the duel detail and the pause look. */
export const SWITCH_VIEWS = [
  { id: 't1', name: 'Segment' },
  { id: 't2', name: 'Symbole' },
  { id: 't3', name: 'Reiter' },
  { id: 't4', name: 'Menü' },
] as const;

export const DETAIL_VIEWS = [
  { id: 'd0', name: 'Klar' },
  { id: 'd1', name: 'Zeitstrahl' },
  { id: 'd2', name: 'Vergleich' },
  { id: 'd3', name: 'Karten' },
] as const;

export const PAUSE_VIEWS = [
  { id: 'p0', name: 'Heute' },
  { id: 'p1', name: 'Leiste' },
  { id: 'p2', name: 'Insel' },
  { id: 'p3', name: 'Navy' },
  { id: 'p4', name: 'Karte' },
] as const;

export type SwitchView = (typeof SWITCH_VIEWS)[number]['id'];
export type DetailView = (typeof DETAIL_VIEWS)[number]['id'];
export type PauseView = (typeof PAUSE_VIEWS)[number]['id'];

function stored<T extends string>(key: string, fallback: T) {
  const value = signal<T>((sessionStore.get(key) as T | null) ?? fallback);
  return {
    value,
    set(next: T): void {
      sessionStore.set(key, next);
      value.set(next);
    },
  };
}

export const switchView = stored<SwitchView>(
  'playduelio.admin.facelift.switch2',
  't2',
);
export const detailView = stored<DetailView>(
  'playduelio.admin.facelift.detail2',
  'd1',
);
export const pauseView = stored<PauseView>('playduelio.admin.facelift.pause', 'p1');

/** Temporary: the notice after pausing, and a preview that stays. */
export const NOTICE_VIEWS = [
  { id: 'm1', name: 'Weiss' },
  { id: 'm2', name: 'Navy' },
  { id: 'm3', name: 'Ecke oben' },
  { id: 'm4', name: 'Pille' },
  { id: 'm5', name: 'Wechsel' },
  { id: 'm6', name: 'Ecke unten' },
  { id: 'm7', name: 'Glas' },
] as const;

export const NOTICE_PREVIEWS = [
  { id: 'pause', name: 'Pause' },
  { id: 'resume', name: 'Freigabe' },
  { id: 'off', name: 'Aus' },
] as const;

export type NoticeView = (typeof NOTICE_VIEWS)[number]['id'];
export type NoticePreview = (typeof NOTICE_PREVIEWS)[number]['id'];

export const noticeView = stored<NoticeView>(
  'playduelio.admin.facelift.notice',
  'm1',
);
export const noticePreview = stored<NoticePreview>(
  'playduelio.admin.facelift.preview2',
  'off',
);

/** Temporary: how the chosen draft arranges its cards. */
export const LAYOUTS = [
  { id: 'b1', name: 'Spalten frei' },
  { id: 'b2', name: 'Angeglichen' },
  { id: 'b3', name: 'Warteband' },
  { id: 'b4', name: 'In den Kennzahlen' },
  { id: 'b5', name: 'Nach Daten' },
] as const;

export type Layout = (typeof LAYOUTS)[number]['id'];

export const layoutView = stored<Layout>('playduelio.admin.facelift.layout2', 'b1');
