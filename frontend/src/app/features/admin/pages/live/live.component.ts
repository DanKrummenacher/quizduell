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
import { localStore } from '../../../../core/platform/safe-storage';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { PlayControl } from '../../core/play-control.service';
import { formatClock, formatSeconds, formatTime } from '../../core/format';
import { every } from '../../core/remote';
import { AutofocusDirective } from '../../ui/autofocus.directive';
import { AdLineChartComponent } from '../../ui/charts';
import { AdKpiComponent } from '../../ui/kpi.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';
import { AdStateComponent } from '../../ui/state.component';

const POLL_MS = 2000;

/** Table or grid for the duels, kept per device. */
const TABLE_KIND = 'playduelio.admin.live.view';
type TableKind = 'table' | 'raster';

/** The short log and the short queue before «show all». */
const SHORT_LOG = 8;
const SHORT_SEARCHING = 4;
const SHORT_CODES = 3;

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
    AdPageHeadComponent,
    AdKpiComponent,
    AutofocusDirective,
    AdLineChartComponent,
    AdStateComponent,
  ],
  templateUrl: './live.component.html',
  styleUrls: ['./live.component.scss', './live-board.scss', './live-duel.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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

  protected readonly mode = signal<ModeFilter>('all');
  protected readonly eventFilter = signal<EventFilter>('all');
  protected readonly openCode = signal<string | null>(null);
  /** Table or grid, as the admin chose it on this device. */
  protected readonly tableKind = signal<TableKind>(
    localStore.get(TABLE_KIND) === 'raster' ? 'raster' : 'table',
  );
  /** The short queue and the short log show everything. */
  protected readonly waitOpen = signal(false);
  protected readonly logAll = signal(false);

  protected readonly formatTime = formatTime;
  protected readonly String = String;
  protected readonly shortLog = SHORT_LOG;

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

  protected setTableKind(kind: TableKind): void {
    this.tableKind.set(kind);
    localStore.set(TABLE_KIND, kind);
  }

  /** Share of the answer time still left, for the rings. */
  protected ringShare(secondsLeft: number): number {
    const total = this.data.settings.value()?.settings.questionDurationSec ?? 20;
    return Math.min(100, Math.round((secondsLeft / total) * 100));
  }

  protected phaseOf(duel: LiveDuel): string {
    return PHASES[duel.phase];
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
      return [];
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
        secondsLeft: secondsLeft(duel, now),
        segments: Array.from({ length: duel.totalQuestions }, (_, index) =>
          index < duel.rounds.length
            ? 'done'
            : index === duel.questionNumber - 1 && duel.phase === 'question'
              ? 'now'
              : 'open',
        ),
        lead: leader(duel),
        cells: cellsOf(duel),
      }));
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

  /** Everyone looking for an opponent, the longest waiting first. */
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

  /** Open games with a code, the longest waiting first. */
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

  protected readonly shownSearching = computed(() =>
    this.waitOpen() ? this.searching() : this.searching().slice(0, SHORT_SEARCHING),
  );
  protected readonly shownWaiting = computed(() =>
    this.waitOpen() ? this.waiting() : this.waiting().slice(0, SHORT_CODES),
  );
  protected readonly queueCut = computed(
    () =>
      this.searching().length > SHORT_SEARCHING ||
      this.waiting().length > SHORT_CODES,
  );

  protected readonly waitStats = computed(() => {
    const list = this.searching();
    if (!list.length) {
      return null;
    }
    const total = list.reduce((sum, entry) => sum + entry.seconds, 0);
    return {
      average: waited((total / list.length) * 1000),
      long: list.filter((entry) => entry.seconds >= 30).length,
    };
  });

  protected readonly events = computed(() => {
    const kinds = EVENT_GROUPS[this.eventFilter()];
    return (this.snapshot()?.events ?? [])
      .filter((event) => !kinds || kinds.includes(event.kind))
      .slice(0, 60)
      .map((event) => ({ ...event, text: describe(event) }));
  });

  protected readonly openDuel = computed(() => {
    const code = this.openCode();
    const duel = this.snapshot()?.duels.find((d) => d.code === code) ?? null;
    if (!duel) {
      return null;
    }
    const later = Math.max(
      0,
      duel.totalQuestions - duel.rounds.length - (duel.phase === 'question' ? 1 : 0),
    );
    return {
      duel,
      age: formatClock(this.now() - duel.startedAt),
      secondsLeft: secondsLeft(duel, this.now()),
      later,
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
  });
}

function secondsLeft(duel: LiveDuel, now: number): number | null {
  return duel.phaseEndsAt !== null
    ? Math.max(0, Math.ceil((duel.phaseEndsAt - now) / 1000))
    : null;
}

/** One cell per question for the grid: done with both answers, now, or open. */
function cellsOf(duel: LiveDuel) {
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
      };
    }
    const current = index === duel.questionNumber - 1 && duel.phase === 'question';
    return {
      state: current ? ('now' as const) : ('open' as const),
      marks: duel.players.map((player) =>
        current && player.answered ? 'given' : 'open',
      ),
    };
  });
}

/** Seconds under a minute, then minutes and seconds. */
function waited(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return seconds < 60 ? `${seconds} s` : formatClock(ms);
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
