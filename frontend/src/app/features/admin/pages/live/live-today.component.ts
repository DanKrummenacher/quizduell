import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  inject,
  signal,
} from '@angular/core';
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
import { PlayControl } from '../../core/play-control.service';
import { formatClock, formatSeconds, formatTime } from '../../core/format';
import { every } from '../../core/remote';
import { AutofocusDirective } from '../../ui/autofocus.directive';
import { AdLineChartComponent } from '../../ui/charts';
import { AdStateComponent } from '../../ui/state.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';

const POLL_MS = 2000;

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

/** Temporary: the live page as it was, to compare with the drafts. */
@Component({
  selector: 'app-admin-live-today',
  imports: [
    AdPageHeadComponent,
    AutofocusDirective,
    AdLineChartComponent,
    AdStateComponent,
  ],
  templateUrl: './live-today.component.html',
  styleUrl: './live-today.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LiveTodayComponent {
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

  protected readonly phases = PHASES;
  protected readonly letters = ANSWER_LETTERS;
  protected readonly formatClock = formatClock;
  protected readonly formatSeconds = formatSeconds;
  protected readonly formatTime = formatTime;

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
    return [
      { label: 'Laufende Duelle', value: running.length },
      {
        label: 'Spielende im Duell',
        value: running.reduce((sum, duel) => sum + duel.players.length, 0),
      },
      { label: 'Suchen einen Gegner', value: snapshot.searching.length },
      { label: 'Warten mit Code', value: snapshot.waiting.length },
    ];
  });

  protected readonly chart = computed(() => {
    const snapshot = this.snapshot();
    if (!snapshot) {
      return null;
    }
    return {
      values: snapshot.history.map((sample) =>
        sample.at + 60_000 < snapshot.since ? null : sample.games,
      ),
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
      }));
  });

  protected readonly searching = computed(() => {
    const now = this.now();
    return (this.snapshot()?.searching ?? []).map((entry) => ({
      ...entry,
      seconds: Math.max(0, Math.round((now - entry.since) / 1000)),
    }));
  });

  protected readonly waiting = computed(() => {
    const now = this.now();
    return (this.snapshot()?.waiting ?? []).map((entry) => ({
      ...entry,
      wait: formatClock(now - entry.since),
    }));
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
    const now = this.now();
    return {
      duel,
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
