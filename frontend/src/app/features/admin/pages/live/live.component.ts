import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/icon';
import type {
  LiveDuel,
  LiveEvent,
  LiveSnapshot,
} from '../../../../core/contracts/admin.contract';
import type { EndReason, GamePhase } from '../../../../core/contracts/game.contract';
import { ANSWER_LETTERS } from '../../../../core/game/answer-letters';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { facelift } from '../../core/facelift-preview';
import {
  detailView,
  duelView,
  layoutView,
  switchView,
  waitView,
} from '../../core/live-demo';
import { localStore } from '../../../../core/platform/safe-storage';
import { PlayControl } from '../../core/play-control.service';
import { formatClock, formatSeconds, formatTime } from '../../core/format';
import { every } from '../../core/remote';
import { AdKpiComponent } from '../../ui/kpi.component';
import { AutofocusDirective } from '../../ui/autofocus.directive';
import { AdLineChartComponent } from '../../ui/charts';
import { AdStateComponent } from '../../ui/state.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';
import { FillHeightDirective } from './fill-height.directive';
import { LiveTodayComponent } from './live-today.component';

const POLL_MS = 2000;

/** Table or grid for the duels, kept per device. */
const TABLE_KIND = 'playduelio.admin.live.view';
type TableKind = 'table' | 'raster';

const PHASES: Record<GamePhase, string> = {
  waiting: 'Wartet',
  countdown: 'Startet',
  question: 'Frage offen',
  reveal: 'Auflösung',
  finished: 'Revanche möglich',
  aborted: 'Abgebrochen',
};

const REASONS: Record<EndReason, string> = {
  'opponent-left': 'jemand hat das Duell verlassen',
  'opponent-disconnected': 'die Verbindung ist abgebrochen',
  expired: 'es konnten keine Fragen geladen werden',
};

type ModeFilter = 'all' | 'quick' | 'friend';
type EventFilter = 'all' | 'start' | 'end' | 'aborted';

const EVENT_GROUPS: Record<EventFilter, LiveEvent['kind'][] | null> = {
  all: null,
  start: ['created', 'joined', 'matched', 'rematch'],
  end: ['finished', 'expired'],
  aborted: ['aborted'],
};

/** The running operation, refreshed every two seconds. */
@Component({
  selector: 'app-admin-live',
  imports: [
    NgTemplateOutlet,
    AdKpiComponent,
    LiveTodayComponent,
    FillHeightDirective,
    AdPageHeadComponent,
    AutofocusDirective,
    AdLineChartComponent,
    AdStateComponent,
  ],
  templateUrl: './live.component.html',
  styleUrl: './live.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[attr.data-face]': 'face()' },
})
export class LiveComponent {
  private readonly api = inject(AdminApi);
  protected readonly data = inject(AdminData);
  protected readonly play = inject(PlayControl);

  protected readonly snapshot = signal<LiveSnapshot | null>(this.data.live());
  protected readonly error = signal<string | null>(null);
  protected readonly paused = signal(false);
  /** Server time now, ticking every second between the snapshots. */
  protected readonly now = signal(Date.now());
  private offset = 0;

  /** Temporary: the facelift draft shown. */
  protected readonly face = computed(() => facelift() ?? 'l1');

  /** Temporary: which cards each draft shows, in which width. */
  protected readonly blocks = computed<Block[]>(() => {
    switch (this.face()) {
      case 'l2':
        return [b('chart', 8), b('wait', 4, true), b('tiles', 8), b('log', 4, true)];
      case 'l3':
        return [b('table', 12), b('chart', 8), b('wait', 4, true), b('log', 12)];
      case 'l5':
        return [
          b('list', 5),
          b('detail', 7),
          b('chart', 8),
          b('wait', 4),
          b('log', 12),
        ];
      case 'l6':
        return [b('raster', 12), b('chart', 8), b('wait', 4, true), b('log', 12)];
      case 'l7':
        return [b('stage', 12), b('chart', 8), b('log', 4, true)];
      case 'l9': {
        const duels = this.tableKind();
        const quiet = this.searching().length + this.waiting().length <= 6;
        switch (this.layoutView.value()) {
          case 'b2':
            return [
              b(duels, 12),
              b('chart', 8, { fill: true }),
              b('wait', 4),
              b('log', 12, { short: true }),
            ];
          case 'b3':
            return [
              b('band', 12),
              b(duels, 12),
              b('chart', 8, { fill: true }),
              b('log', 4, { fit: true }),
            ];
          case 'b4':
            return [
              b(duels, 12),
              b('chart', 8, { fill: true }),
              b('log', 4, { fit: true }),
            ];
          case 'b5':
            return quiet
              ? [
                  b('band', 12),
                  b(duels, 12),
                  b('chart', 8, { fill: true }),
                  b('log', 4, { fit: true }),
                ]
              : [
                  b(duels, 12),
                  b('chart', 8, { area: 'main' }),
                  b('log', 8, { area: 'main', short: true }),
                  b('wait', 4, { area: 'side' }),
                ];
          default:
            return [
              b(duels, 12),
              b('chart', 8, { area: 'main' }),
              b('log', 8, { area: 'main', short: true }),
              b('wait', 4, { area: 'side' }),
            ];
        }
      }
      case 'l8':
        return this.duelView() === 'list'
          ? [
              b('list', 5),
              b('detail', 7),
              b('chart', 8),
              b('wait', 4, true),
              b('log', 12),
            ]
          : [
              b(this.duelView(), 12),
              b('chart', 8),
              b('wait', 4, true),
              b('log', 12),
            ];
      default:
        return [b('chart', 8), b('wait', 4, true), b('table', 8), b('log', 4, true)];
    }
  });

  protected readonly duelView = duelView;
  protected readonly layoutView = layoutView;
  /** The chosen draft with a side column. */
  protected readonly split = computed(() =>
    this.blocks().some((x) => x.area === 'side'),
  );
  protected readonly topBlocks = computed(() =>
    this.blocks().filter((x) => x.area === 'grid'),
  );
  protected readonly mainBlocks = computed(() =>
    this.blocks().filter((x) => x.area === 'main'),
  );
  protected readonly sideBlocks = computed(() =>
    this.blocks().filter((x) => x.area === 'side'),
  );
  /** The figures carry the queue in the «In den Kennzahlen» draft. */
  protected readonly kpiQueue = computed(
    () => this.face() === 'l9' && this.layoutView.value() === 'b4',
  );
  /** Height the chart fills where it takes the height of its row. */
  protected readonly fillHeight = signal(0);
  /** The short log shows everything. */
  protected readonly logAll = signal(false);
  protected readonly switchView = switchView;
  protected readonly detailView = detailView;
  /** The queue as a summary in the chosen draft. */
  protected readonly waitMode = computed(() =>
    this.face() === 'l9' ? 'summary' : this.waitView(),
  );

  /** Table or grid, as the admin chose it on this device. */
  protected readonly tableKind = signal<TableKind>(
    localStore.get(TABLE_KIND) === 'raster' ? 'raster' : 'table',
  );
  protected readonly tableKinds: { id: TableKind; label: string; hint: string }[] = [
    {
      id: 'table',
      label: 'Tabelle',
      hint: 'Eine Zeile pro Duell mit Fortschritt und Punkten',
    },
    {
      id: 'raster',
      label: 'Raster',
      hint: 'Jede Frage als Feld, richtig oder falsch auf einen Blick',
    },
  ];
  protected readonly viewMenu = signal(false);

  protected setTableKind(kind: TableKind): void {
    this.tableKind.set(kind);
    localStore.set(TABLE_KIND, kind);
  }
  protected readonly waitView = waitView;
  /** The short queue shows everyone. */
  protected readonly waitOpen = signal(false);

  protected readonly mode = signal<ModeFilter>('all');
  protected readonly eventFilter = signal<EventFilter>('all');
  protected readonly openCode = signal<string | null>(null);

  protected readonly phases = PHASES;
  protected readonly letters = ANSWER_LETTERS;
  protected readonly formatClock = formatClock;
  protected readonly formatSeconds = formatSeconds;
  protected readonly formatTime = formatTime;
  protected readonly String = String;

  protected readonly modeOptions: { id: ModeFilter; label: string }[] = [
    { id: 'all', label: 'Alle' },
    { id: 'quick', label: 'Schnellspiel' },
    { id: 'friend', label: 'Mit Code' },
  ];

  protected readonly eventOptions: { id: EventFilter; label: string }[] = [
    { id: 'all', label: 'Alle' },
    { id: 'start', label: 'Starts' },
    { id: 'end', label: 'Beendet' },
    { id: 'aborted', label: 'Abbrüche' },
  ];

  constructor() {
    void this.refresh();
    every(POLL_MS, () => {
      if (!this.paused()) {
        void this.refresh();
      }
    });
    every(1000, () => {
      if (!this.paused()) {
        this.now.set(Date.now() + this.offset);
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected closeDrawer(): void {
    this.openCode.set(null);
    this.viewMenu.set(false);
  }

  /** Share of the answer time still left, for the ring. */
  private questionMs(): number {
    return (this.data.settings.value()?.settings.questionDurationSec ?? 20) * 1000;
  }

  /** Duels by phase, the ones asking a question first. */
  protected readonly phaseGroups = computed(() =>
    (
      [
        ['question', 'Frage läuft'],
        ['reveal', 'Auflösung'],
        ['countdown', 'Startet'],
        ['waiting', 'Wartet'],
        ['finished', 'Revanche möglich'],
      ] as const
    )
      .map(([phase, label]) => ({
        phase,
        label,
        rows: this.duels().filter((row) => row.duel.phase === phase),
      }))
      .filter((group) => group.rows.length),
  );

  /** Wait share of a minute, for the bars and rings of the queue. */
  protected waitShare(seconds: number): number {
    return Math.min(100, Math.round((seconds / 60) * 100));
  }

  protected readonly waitStats = computed(() => {
    const list = this.searching();
    if (!list.length) {
      return null;
    }
    const total = list.reduce((sum, entry) => sum + entry.seconds, 0);
    return {
      average: waited((total / list.length) * 1000),
      longest: list[0]!.wait,
      long: list.filter((entry) => entry.seconds >= 30).length,
    };
  });

  protected ringShare(secondsLeft: number): number {
    const total = this.data.settings.value()?.settings.questionDurationSec ?? 20;
    return Math.min(100, Math.round((secondsLeft / total) * 100));
  }

  protected phaseOf(duel: LiveDuel): string {
    return PHASES[duel.phase];
  }

  protected retry(): void {
    void this.refresh();
  }

  protected togglePause(): void {
    this.paused.update((paused) => !paused);
    if (!this.paused()) {
      void this.refresh();
    }
  }

  private async refresh(): Promise<void> {
    try {
      const snapshot = await this.api.live();
      this.offset = snapshot.serverNow - Date.now();
      this.now.set(snapshot.serverNow);
      this.snapshot.set(snapshot);
      this.data.live.set(snapshot);
      this.data.reachable.set(true);
      this.error.set(null);
    } catch (error) {
      this.data.reachable.set(false);
      this.error.set(
        error instanceof Error ? error.message : 'Keine Verbindung zum Server.',
      );
    }
  }

  protected readonly running = computed(
    () => this.snapshot()?.duels.filter((d) => d.phase !== 'finished') ?? [],
  );

  protected readonly metrics = computed(() => {
    const snapshot = this.snapshot();
    if (!snapshot) {
      return null;
    }
    const running = this.running();
    const now = this.now();
    const oldest = (list: { since: number }[]) =>
      list.length ? waited(now - Math.min(...list.map((e) => e.since))) : null;
    const searching = oldest(snapshot.searching);
    const waiting = oldest(snapshot.waiting);
    return [
      {
        label: 'Laufende Duelle',
        value: running.length,
        note: snapshot.peak?.games
          ? `Höchststand ${snapshot.peak.games} um ${formatTime(snapshot.peak.at)}`
          : 'Noch kein Duell in der letzten Stunde',
      },
      {
        label: 'Spielende im Duell',
        value: running.reduce((sum, duel) => sum + duel.players.length, 0),
        note: running.length
          ? `${running.filter((d) => d.mode === 'quick').length} Schnellspiel · ${running.filter((d) => d.mode === 'friend').length} mit Code`
          : 'Niemand spielt gerade',
      },
      {
        label: 'Suchen einen Gegner',
        value: snapshot.searching.length,
        note: searching ? `am längsten seit ${searching}` : 'Niemand wartet',
      },
      {
        label: 'Warten mit Code',
        value: snapshot.waiting.length,
        note: waiting ? `am längsten seit ${waiting}` : 'Kein Code offen',
      },
    ];
  });

  protected readonly chart = computed(() => {
    const snapshot = this.snapshot();
    if (!snapshot) {
      return null;
    }
    const values = snapshot.history.map((sample) =>
      sample.at + 60_000 < snapshot.since ? null : sample.games,
    );
    return {
      values,
      quiet: values.every((value) => !value),
      labels: snapshot.history.map((sample) => formatTime(sample.at)),
      startedRecently: snapshot.since > snapshot.history[0]!.at,
      since: formatTime(snapshot.since),
      peak: snapshot.peak,
    };
  });

  protected readonly duels = computed(() => {
    const mode = this.mode();
    const now = this.now();
    return (this.snapshot()?.duels ?? [])
      .filter((duel) => mode === 'all' || duel.mode === mode)
      .map((duel) => ({
        duel,
        age: formatClock(now - duel.startedAt),
        secondsLeft:
          duel.phaseEndsAt !== null
            ? Math.max(0, Math.ceil((duel.phaseEndsAt - now) / 1000))
            : null,
        segments: Array.from({ length: duel.totalQuestions }, (_, index) =>
          index < duel.rounds.length
            ? 'done'
            : index === duel.questionNumber - 1 && duel.phase === 'question'
              ? 'now'
              : 'open',
        ),
        lead: leader(duel),
        cells: cellsOf(duel, now),
        lane: duel.players.map((player, p) =>
          Array.from({ length: duel.totalQuestions }, (_, index) => {
            const round = duel.rounds[index];
            if (round) {
              const answer = round.answers[p];
              return {
                mark:
                  answer?.index === null || answer === undefined
                    ? 'none'
                    : answer.index === round.correctIndex
                      ? 'right'
                      : 'wrong',
                width:
                  answer?.ms === null || answer?.ms === undefined
                    ? 100
                    : Math.min(100, (answer.ms / this.questionMs()) * 100),
              };
            }
            const current =
              index === duel.questionNumber - 1 && duel.phase === 'question';
            return current
              ? {
                  mark: player.answered ? 'given' : 'now',
                  width:
                    duel.phaseEndsAt === null
                      ? 0
                      : Math.min(
                          100,
                          Math.max(
                            0,
                            100 -
                              ((duel.phaseEndsAt - now) / this.questionMs()) * 100,
                          ),
                        ),
                }
              : { mark: 'open', width: 0 };
          }),
        ),
        marks: duel.players.map((_, player) =>
          Array.from({ length: duel.totalQuestions }, (_, index) => {
            const round = duel.rounds[index];
            if (!round) {
              return index === duel.questionNumber - 1 && duel.phase === 'question'
                ? 'now'
                : 'open';
            }
            const answer = round.answers[player];
            return answer?.index === null || !answer
              ? 'none'
              : answer.index === round.correctIndex
                ? 'right'
                : 'wrong';
          }),
        ),
      }));
  });

  /** What the empty duel list says beyond «nothing runs». */
  protected readonly emptyDuels = computed(() => {
    const snapshot = this.snapshot();
    if (!snapshot) {
      return null;
    }
    if (snapshot.duels.length) {
      return {
        filtered: true,
        title:
          this.mode() === 'quick'
            ? 'Gerade kein Schnellspiel'
            : 'Gerade kein Duell mit Code',
        text: `${snapshot.duels.length === 1 ? 'Ein Duell läuft' : `${snapshot.duels.length} Duelle laufen`} im anderen Modus.`,
      };
    }
    const [searcher] = snapshot.searching;
    const [code] = snapshot.waiting;
    return {
      filtered: false,
      title: 'Gerade läuft kein Duell',
      text: this.data.paused()
        ? 'Das Spiel ist pausiert, es starten keine neuen Duelle.'
        : searcher
          ? `${searcher.name} sucht gerade einen Gegner. Sobald jemand dazukommt, erscheint das Duell hier.`
          : code
            ? `${code.name} wartet mit Code ${code.code}. Sobald jemand beitritt, erscheint das Duell hier.`
            : 'Sobald zwei Spielende verbunden sind, erscheint das Duell hier, mit Fortschritt und Punkten.',
    };
  });

  /** What the empty log says, with or without a filter. */
  protected readonly emptyEvents = computed(() => {
    switch (this.eventFilter()) {
      case 'start':
        return 'Seit dem Serverstart hat noch kein Duell begonnen.';
      case 'end':
        return 'Seit dem Serverstart ist noch kein Duell zu Ende gespielt.';
      case 'aborted':
        return 'Seit dem Serverstart wurde kein Duell abgebrochen.';
      default:
        return 'Starts, Ergebnisse und Abbrüche erscheinen hier, sobald gespielt wird.';
    }
  });

  /** Column numbers of the grid, from the longest duel. */
  protected readonly questionNumbers = computed(() =>
    Array.from(
      {
        length: Math.max(
          7,
          ...(this.snapshot()?.duels ?? []).map((d) => d.totalQuestions),
        ),
      },
      (_, i) => i + 1,
    ),
  );

  protected readonly searching = computed(() => {
    const now = this.now();
    return (this.snapshot()?.searching ?? [])
      .map((entry) => ({
        ...entry,
        seconds: Math.max(0, Math.round((now - entry.since) / 1000)),
        wait: waited(now - entry.since),
      }))
      .sort((a, b) => b.seconds - a.seconds);
  });

  protected readonly waiting = computed(() => {
    const now = this.now();
    return (this.snapshot()?.waiting ?? [])
      .map((entry) => ({
        ...entry,
        seconds: Math.max(0, Math.round((now - entry.since) / 1000)),
        wait: waited(now - entry.since),
      }))
      .sort((a, b) => b.seconds - a.seconds);
  });

  protected readonly events = computed(() => {
    const kinds = EVENT_GROUPS[this.eventFilter()];
    return (this.snapshot()?.events ?? [])
      .filter((event) => !kinds || kinds.includes(event.kind))
      .slice(0, 60)
      .map((event) => ({ ...event, text: describe(event) }));
  });

  protected readonly openDuel = computed(() =>
    this.face() === 'l5' ? null : this.viewOf(this.openCode()),
  );

  /** The duel shown beside the list: the one opened, else the newest. */
  protected readonly detailDuel = computed(() => {
    const duels = this.duels();
    const open = this.openCode();
    const code = duels.some((row) => row.duel.code === open)
      ? open
      : (duels[0]?.duel.code ?? null);
    return this.viewOf(code);
  });

  private viewOf(code: string | null) {
    const duel = this.snapshot()?.duels.find((d) => d.code === code) ?? null;
    if (!duel) {
      return null;
    }
    const now = this.now();
    return {
      duel,
      lead: leader(duel),
      players: duel.players.map((player, p) => ({
        ...player,
        marks: marksOf(duel, p),
      })),
      table: Array.from({ length: duel.totalQuestions }, (_, index) => {
        const round = duel.rounds[index];
        if (round) {
          return {
            number: index + 1,
            state: 'done' as const,
            text: round.text,
            correct: round.options[round.correctIndex] ?? '',
            answers: round.answers.map((answer) => ({
              right: answer.index === round.correctIndex,
              none: answer.index === null,
              given: true,
              letter:
                answer.index === null ? null : (ANSWER_LETTERS[answer.index] ?? ''),
              time: formatSeconds(answer.ms),
              points: answer.points,
            })),
          };
        }
        const current =
          index === duel.questionNumber - 1 && duel.phase === 'question';
        return {
          number: index + 1,
          state: current ? ('now' as const) : ('open' as const),
          text: current ? duel.currentQuestion : null,
          correct: '',
          answers: duel.players.map((player) => ({
            right: false,
            none: true,
            given: current && player.answered,
            letter: null,
            time: '',
            points: 0,
          })),
        };
      }),
      age: formatClock(now - duel.startedAt),
      secondsLeft:
        duel.phaseEndsAt !== null
          ? Math.max(0, Math.ceil((duel.phaseEndsAt - now) / 1000))
          : null,
      upcoming: Math.max(
        0,
        duel.totalQuestions -
          duel.rounds.length -
          (duel.phase === 'question' ? 1 : 0),
      ),
      later: Array.from(
        {
          length: Math.max(
            0,
            duel.totalQuestions -
              duel.rounds.length -
              (duel.phase === 'question' ? 1 : 0),
          ),
        },
        (_, i) => duel.rounds.length + (duel.phase === 'question' ? 2 : 1) + i,
      ),
      rounds: [...duel.rounds].reverse().map((round, index) => ({
        number: duel.rounds.length - index,
        text: round.text,
        correct: round.options[round.correctIndex] ?? '',
        answers: round.answers.map((answer, player) => ({
          name: duel.players[player]?.name ?? '',
          letter:
            answer.index === null ? null : (ANSWER_LETTERS[answer.index] ?? ''),
          right: answer.index === round.correctIndex,
          time: formatSeconds(answer.ms),
          points: answer.points,
        })),
      })),
    };
  }
}

type BlockId =
  | 'band'
  | 'hero'
  | 'lane'
  | 'dense'
  | 'scoreboard'
  | 'phase'
  | 'chart'
  | 'wait'
  | 'table'
  | 'tiles'
  | 'list'
  | 'detail'
  | 'raster'
  | 'stage'
  | 'log';

interface Block {
  id: BlockId;
  span: number;
  /** Takes the height of its neighbour and scrolls inside it. */
  fit: boolean;
  /** The chart grows to the height of its row. */
  fill: boolean;
  /** A few entries, the rest on demand. */
  short: boolean;
  /** Where it stands: the grid, or the main or side column. */
  area: 'grid' | 'main' | 'side';
}

function b(
  id: BlockId,
  span: number,
  options: Partial<Pick<Block, 'fit' | 'fill' | 'short' | 'area'>> | boolean = {},
): Block {
  const o = typeof options === 'boolean' ? { fit: options } : options;
  return {
    id,
    span,
    fit: o.fit ?? false,
    fill: o.fill ?? false,
    short: o.short ?? false,
    area: o.area ?? 'grid',
  };
}

/** One cell per question for the grid: done with both answers, now, or open. */
function cellsOf(duel: LiveDuel, now: number) {
  return Array.from({ length: duel.totalQuestions }, (_, index) => {
    const round = duel.rounds[index];
    if (round) {
      return {
        state: 'done' as const,
        marks: round.answers.map((answer) =>
          answer.index === null
            ? 'none'
            : answer.index === round.correctIndex
              ? 'right'
              : 'wrong',
        ),
        seconds: null,
      };
    }
    const current = index === duel.questionNumber - 1 && duel.phase === 'question';
    return {
      state: current ? ('now' as const) : ('open' as const),
      marks: duel.players.map((player) =>
        current && player.answered ? 'given' : 'open',
      ),
      seconds:
        current && duel.phaseEndsAt !== null
          ? Math.max(0, Math.ceil((duel.phaseEndsAt - now) / 1000))
          : null,
    };
  });
}

/** Seconds under a minute, then minutes and seconds. */
function waited(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return seconds < 60 ? `${seconds} s` : formatClock(ms);
}

/** Per question how one player did: right, wrong, none, now or open. */
function marksOf(duel: LiveDuel, player: number): string[] {
  return Array.from({ length: duel.totalQuestions }, (_, index) => {
    const round = duel.rounds[index];
    if (!round) {
      return index === duel.questionNumber - 1 && duel.phase === 'question'
        ? 'now'
        : 'open';
    }
    const answer = round.answers[player];
    return answer?.index === null || answer === undefined
      ? 'none'
      : answer.index === round.correctIndex
        ? 'right'
        : 'wrong';
  });
}

function leader(duel: LiveDuel): number | null {
  const [a, b] = duel.players;
  if (!a || !b || a.score === b.score) {
    return null;
  }
  return a.score > b.score ? 0 : 1;
}

function describe(event: LiveEvent): string {
  const [a = '', b = ''] = event.names;
  switch (event.kind) {
    case 'created':
      return `${a} wartet mit Code ${event.code}`;
    case 'joined':
      return `${b || 'Jemand'} tritt dem Duell ${event.code} von ${a} bei`;
    case 'matched':
      return `${a} und ${b} spielen ein Schnellspiel`;
    case 'rematch':
      return `${a} und ${b} spielen eine Revanche`;
    case 'finished': {
      const [x = 0, y = 0] = event.scores ?? [];
      return `${a} ${x} : ${y} ${b} – Duell beendet`;
    }
    case 'aborted':
      return `Duell ${event.code} abgebrochen, ${REASONS[event.reason ?? 'opponent-left']}`;
    case 'expired':
      return `Code ${event.code} ohne Gegner abgelaufen`;
  }
}
