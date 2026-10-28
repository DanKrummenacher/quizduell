import {
  Component,
  DestroyRef,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import { NgTemplateOutlet } from '@angular/common';
import { faceData, facelift, setFacelift } from '../../core/facelift-preview';
import {
  SAMPLE_ALARM,
  SAMPLE_HINTS,
  SAMPLE_POOL,
  SAMPLE_QUESTIONS,
} from './hints-sample';
import type {
  AdminQuestion,
  Hint,
  HintSeverity,
  HintType,
} from '../../../../core/contracts/admin.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { formatInt, formatPercent, share } from '../../core/format';
import { HINT_TYPE_LABELS, hintText, SEVERITY_LABELS } from '../../core/hint-texts';
import { NotifyService } from '../../core/notify.service';
import { AdAnswerDistributionComponent } from '../../ui/answer-distribution.component';
import { AdStateComponent } from '../../ui/state.component';
import { messageOf } from '../questions/questions.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';
import { HintsNextListComponent } from './next/hints-next-list.component';
import { HintsNextOwnComponent } from './next/hints-next-own.component';
import { HintsNextXComponent } from './next/hints-next-x.component';
import { HintsProComponent } from './next/hints-pro.component';
import { HintsStudioComponent } from './next/hints-studio.component';
import { HintsNextRulesComponent } from './next/hints-next-rules.component';

const SEVERITY_ORDER: Record<HintSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

const TYPE_ICONS: Record<HintType, string> = {
  'pool-empty': 'priority-warning',
  'pool-small': 'items-list',
  lure: 'target',
  hard: 'arrow-down',
  easy: 'arrow-up',
  timeouts: 'time',
};

/** «Prüfstand»: what is checked, one row per rule. */
const CHECKS: { id: string; label: string; rule: string; types: HintType[] }[] = [
  {
    id: 'pool',
    label: 'Genug Fragen im Spiel',
    rule: 'Mindestens viermal so viele aktive Fragen, wie ein Duell braucht.',
    types: ['pool-empty', 'pool-small'],
  },
  {
    id: 'lure',
    label: 'Keine Antwort lockt',
    rule: 'Keine falsche Antwort wird öfter gewählt als die richtige.',
    types: ['lure'],
  },
  {
    id: 'hard',
    label: 'Nicht zu schwer',
    rule: 'Mindestens 30 % antworten richtig.',
    types: ['hard'],
  },
  {
    id: 'easy',
    label: 'Nicht zu leicht',
    rule: 'Weniger als 95 % antworten richtig.',
    types: ['easy'],
  },
  {
    id: 'timeouts',
    label: 'Die Zeit reicht',
    rule: 'In weniger als jedem fünften Duell läuft die Zeit ab.',
    types: ['timeouts'],
  },
];

/** «Entscheiden»: the question each kind of hint asks, and its answers. */
interface Choice {
  label: string;
  note: string;
  to: 'edit' | 'new' | 'rules' | 'pause' | 'ignore';
}
const DECISIONS: Record<HintType, { ask: string; choices: Choice[] }> = {
  lure: {
    ask: 'Stimmt die richtige Antwort?',
    choices: [
      {
        label: 'Ja – Frage klarer stellen',
        note: 'Die Frage lässt zu viel offen.',
        to: 'edit',
      },
      {
        label: 'Nein – Antwort korrigieren',
        note: 'Die lockende Antwort ist eigentlich richtig.',
        to: 'edit',
      },
      { label: 'Passt so', note: 'Die Falle ist gewollt.', to: 'ignore' },
    ],
  },
  hard: {
    ask: 'Soll die Frage leichter werden?',
    choices: [
      {
        label: 'Vereinfachen',
        note: 'Einen Hinweis in die Frage nehmen.',
        to: 'edit',
      },
      { label: 'Pausieren', note: 'Kommt in keinem Duell mehr vor.', to: 'pause' },
      { label: 'Bewusst schwer', note: 'Darf schwierig bleiben.', to: 'ignore' },
    ],
  },
  easy: {
    ask: 'Soll die Frage schwerer werden?',
    choices: [
      {
        label: 'Antworten verbessern',
        note: 'Falsche Antworten plausibler machen.',
        to: 'edit',
      },
      { label: 'Pausieren', note: 'Kommt in keinem Duell mehr vor.', to: 'pause' },
      {
        label: 'Bewusst leicht',
        note: 'Ein leichter Einstieg ist gewollt.',
        to: 'ignore',
      },
    ],
  },
  timeouts: {
    ask: 'Woran liegt es?',
    choices: [
      { label: 'Frage zu lang', note: 'Frage oder Antworten kürzen.', to: 'edit' },
      { label: 'Zu wenig Zeit', note: 'Die Zeit pro Frage erhöhen.', to: 'rules' },
      { label: 'Passt so', note: 'Gehört zum Schwierigkeitsgrad.', to: 'ignore' },
    ],
  },
  'pool-small': {
    ask: 'Mehr Fragen erfassen?',
    choices: [
      {
        label: 'Frage erfassen',
        note: 'Neue Fragen bringen Abwechslung.',
        to: 'new',
      },
      { label: 'Später', note: 'Der Bestand reicht vorerst.', to: 'ignore' },
    ],
  },
  'pool-empty': {
    ask: 'Duelle wieder möglich machen?',
    choices: [
      {
        label: 'Frage erfassen',
        note: 'Ab genug aktiven Fragen starten Duelle wieder.',
        to: 'new',
      },
      {
        label: 'Fragen aktivieren',
        note: 'Pausierte Fragen wieder einschalten.',
        to: 'edit',
      },
    ],
  },
};

const TYPE_NOTES: Record<HintType, string> = {
  'pool-empty': 'Weniger aktive Fragen, als ein Duell braucht.',
  'pool-small': 'Zu wenige aktive Fragen für abwechslungsreiche Duelle.',
  lure: 'Mehr Spielende wählen eine falsche Antwort als die richtige.',
  hard: 'Weniger als 30 % antworten richtig.',
  easy: 'Mindestens 95 % antworten richtig – die Frage entscheidet kein Duell.',
  timeouts: 'In mindestens jedem fünften Duell läuft die Zeit ab.',
};

/**
 * What the admin found on its own: too few questions, answers that mislead,
 * questions that are too hard, too easy or too long. Each finding explains
 * itself and offers the fitting action.
 */
/** Temporary: how far the correct answer is ahead of the best wrong one. */
function leadOf(picks: number[], correctIndex: number): number {
  const total = picks.reduce((sum, n) => sum + n, 0) || 1;
  const wrong = Math.max(0, ...picks.filter((_, i) => i !== correctIndex));
  return ((picks[correctIndex] ?? 0) - wrong) / total;
}

@Component({
  selector: 'app-admin-hints',
  imports: [
    NgTemplateOutlet,
    AdPageHeadComponent,
    RouterLink,
    AdAnswerDistributionComponent,
    AdStateComponent,
    HintsNextRulesComponent,
    HintsNextListComponent,
    HintsNextOwnComponent,
    HintsNextXComponent,
    HintsProComponent,
    HintsStudioComponent,
  ],
  templateUrl: './hints.component.html',
  styleUrls: [
    './hints.component.scss',
    './hints-drafts.scss',
    './hints-drafts-2.scss',
    './hints-drafts-3.scss',
    './hints-drafts-4.scss',
    './hints-drafts-5.scss',
    './hints-drafts-6.scss',
    './hints-drafts-7.scss',
    './hints-drafts-8.scss',
    './hints-drafts-9.scss',
    './hints-drafts-10.scss',
    './hints-drafts-11.scss',
    './hints-drafts-12.scss',
    './hints-drafts-13.scss',
    './hints-drafts-14.scss',
    './hints-drafts-15.scss',
    './hints-drafts-16.scss',
    './hints-new.scss',
    '../questions/questions-bulk.scss',
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HintsComponent {
  protected readonly data = inject(AdminData);
  private readonly api = inject(AdminApi);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly icons = TYPE_ICONS;
  protected readonly severityLabels = SEVERITY_LABELS;

  protected iconOf(hint: Hint): string {
    return TYPE_ICONS[hint.type];
  }

  protected kindOf(hint: Hint): string {
    return HINT_TYPE_LABELS[hint.type];
  }

  protected severityOf(hint: Hint): string {
    return SEVERITY_LABELS[hint.severity];
  }
  protected readonly typeLabels = HINT_TYPE_LABELS;
  protected readonly formatInt = formatInt;

  protected readonly tab = signal<'open' | 'ignored'>('open');
  protected readonly type = signal<HintType | null>(null);
  protected readonly selectedKey = signal<string | null>(null);
  protected readonly busy = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  /** Temporary: the draft shown, and sample data instead of the real one. */
  protected readonly face = computed(() => facelift() ?? '0');
  protected readonly sample = computed(() => faceData() === 'full');
  protected readonly allHints = computed(() =>
    faceData() === 'alarm'
      ? SAMPLE_ALARM
      : this.sample()
        ? SAMPLE_HINTS
        : this.data.hints.value(),
  );
  private readonly sampled = computed(() => faceData() !== 'empty');
  private questionOf(id: number | null) {
    if (this.sampled()) {
      return SAMPLE_QUESTIONS.find((q) => q.id === id) ?? null;
    }
    return this.data.questionById(id);
  }

  /** The severity picked from the figures, null for all. */
  protected readonly severity = signal<HintSeverity | null>(null);
  /** The hint opened inline, in the drawer or in focus. */
  protected readonly expanded = signal<string | null>(null);
  protected readonly drawer = signal<string | null>(null);

  protected readonly severityCounts = computed(() => {
    const open = (this.allHints() ?? []).filter((h) => !h.ignored);
    return {
      critical: open.filter((h) => h.severity === 'critical').length,
      high: open.filter((h) => h.severity === 'high').length,
      medium: open.filter((h) => h.severity === 'medium').length,
    };
  });

  /** The open hints by severity, for «Nach Wichtigkeit». */
  protected readonly groups = computed(() =>
    (['critical', 'high', 'medium'] as HintSeverity[])
      .map((severity) => ({
        severity,
        label: SEVERITY_LABELS[severity],
        items: this.list().filter((item) => item.hint.severity === severity),
      }))
      .filter((group) => group.items.length),
  );

  protected readonly drawerItem = computed(
    () => this.list().find((item) => item.hint.key === this.drawer()) ?? null,
  );

  /** «Einer nach dem anderen»: where the selected hint stands. */
  protected readonly position = computed(() => {
    const list = this.list();
    const index = list.findIndex(
      (item) => item.hint.key === this.selected()?.hint.key,
    );
    return { index, total: list.length };
  });

  protected step(direction: 1 | -1): void {
    const list = this.list();
    const { index } = this.position();
    const next = list[(index + direction + list.length) % list.length];
    if (next) {
      this.select(next.hint.key);
    }
  }

  protected setSeverity(severity: HintSeverity | null): void {
    this.tab.set('open');
    this.severity.set(this.severity() === severity ? null : severity);
  }

  protected readonly severityList: {
    id: HintSeverity;
    label: string;
    note: string;
  }[] = [
    { id: 'critical', label: 'Kritisch', note: 'betrifft das Spiel direkt' },
    { id: 'high', label: 'Wichtig', note: 'bald angehen' },
    { id: 'medium', label: 'Prüfen', note: 'bei Gelegenheit' },
  ];

  protected severityNote(severity: HintSeverity): string {
    return this.severityList.find((s) => s.id === severity)?.note ?? '';
  }

  /** The measured value of a hint, short, for the table. */
  protected metric(hint: Hint): string {
    switch (hint.type) {
      case 'pool-empty':
      case 'pool-small':
        return `${formatInt(hint.value)} von ${formatInt(hint.sample)}`;
      case 'timeouts':
        return `${formatPercent(hint.value)} ohne Antwort`;
      case 'lure':
        return `${formatPercent(hint.value)} falsch`;
      default:
        return `${formatPercent(hint.value)} richtig`;
    }
  }

  /** Runde 2: which drafts bring their own top instead of the figures. */
  protected readonly classic = computed(() =>
    ['h1', 'h2', 'h3', 'h4', 'h5'].includes(this.face()),
  );

  /** «Lagebild»: one sentence for the state, the next hint, the rest. */
  protected readonly state = computed(() => {
    const c = this.severityCounts();
    const open = this.counts().open;
    if (c.critical) {
      return {
        tone: 'critical',
        title: 'Das Spiel braucht sofort Aufmerksamkeit',
        text: 'Ein kritischer Hinweis betrifft die Duelle direkt – zuerst diesen angehen.',
      };
    }
    if (c.high) {
      return {
        tone: 'high',
        title:
          c.high === 1
            ? '1 Frage solltest du bald ansehen'
            : `${c.high} Fragen solltest du bald ansehen`,
        text: 'Das Spiel läuft. Einzelne Fragen verwirren oder sind zu schwer.',
      };
    }
    if (open) {
      return {
        tone: 'medium',
        title: 'Das Spiel läuft gut',
        text: `${open === 1 ? 'Ein Hinweis' : open + ' Hinweise'} zum Prüfen bei Gelegenheit.`,
      };
    }
    return {
      tone: 'ok',
      title: 'Alles in Ordnung',
      text: 'Keine Frage fällt auf, und es gibt genug Fragen.',
    };
  });

  protected readonly bar = computed(() => {
    const c = this.severityCounts();
    const total = c.critical + c.high + c.medium;
    return this.severityList
      .map((sev) => ({
        ...sev,
        count: c[sev.id],
        share: total ? c[sev.id] / total : 0,
      }))
      .filter((part) => part.count);
  });

  /** All open hints, whatever the filter, for summaries. */
  protected readonly openList = computed(() =>
    (this.allHints() ?? [])
      .filter((hint) => !hint.ignored)
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      .map((hint) => this.describe(hint)),
  );
  protected readonly questionItemsOpen = computed(
    () => this.openList().filter((item) => item.hint.questionId !== null).length,
  );

  /** «Nach Frage»: the hints on the pool and those on single questions. */
  protected readonly poolItems = computed(() =>
    this.list().filter((item) => item.hint.questionId === null),
  );
  protected readonly questionItems = computed(() =>
    this.list().filter((item) => item.hint.questionId !== null),
  );
  protected readonly affected = computed(
    () =>
      new Set(
        (this.allHints() ?? [])
          .filter((hint) => !hint.ignored && hint.questionId !== null)
          .map((hint) => hint.questionId),
      ).size,
  );
  protected readonly questionGroups = computed(() => {
    const list = this.questionItems();
    const groups = new Map<number, typeof list>();
    for (const item of list) {
      const id = item.hint.questionId ?? 0;
      groups.set(id, [...(groups.get(id) ?? []), item]);
    }
    return [...groups].map(([id, items]) => ({
      id,
      question: items[0]?.question ?? null,
      items,
    }));
  });
  protected readonly activeCount = computed(() =>
    faceData() === 'alarm'
      ? (SAMPLE_ALARM[0]?.value ?? 0)
      : (this.sampled() ? SAMPLE_POOL : (this.data.questions.value() ?? [])).filter(
          (q) => q.active,
        ).length,
  );

  /** «Spalten»: the hints by severity, all three columns always there. */
  protected readonly columns = computed(() =>
    this.severityList.map((sev) => ({
      ...sev,
      items: this.list().filter((item) => item.hint.severity === sev.id),
    })),
  );

  /** «Bericht»: the hints by kind, each kind explained once. */
  protected readonly kinds = computed(() => {
    const list = this.list();
    const groups = new Map<HintType, typeof list>();
    for (const item of list) {
      groups.set(item.hint.type, [...(groups.get(item.hint.type) ?? []), item]);
    }
    return [...groups].map(([id, items]) => ({
      id,
      label: HINT_TYPE_LABELS[id],
      note: TYPE_NOTES[id],
      items,
    }));
  });

  /** «Verteilung»: how often each judged question is answered correctly. */
  protected readonly spread = computed(() => {
    const pool = (
      this.sampled() ? SAMPLE_POOL : (this.data.questions.value() ?? [])
    ).filter((q) => q.active && q.stats.answers >= 20);
    const flagged = new Map(
      (this.allHints() ?? [])
        .filter((hint) => !hint.ignored && hint.questionId !== null)
        .map((hint) => [hint.questionId, hint]),
    );
    const lanes: number[] = [];
    return pool
      .map((q) => ({
        id: q.id,
        text: q.text,
        category: q.category ?? 'Ohne Kategorie',
        rate: q.stats.correct / q.stats.answers,
        time: q.stats.timeouts / Math.max(1, q.stats.answers + q.stats.timeouts),
        lead: leadOf(q.stats.picks, q.correctIndex),
        hint: flagged.get(q.id) ?? null,
      }))
      .sort((a, b) => a.rate - b.rate)
      .map((point) => {
        // The next lane where the dot does not touch the one before.
        let lane = lanes.findIndex((last) => point.rate - last >= 0.022);
        if (lane < 0) {
          lane = lanes.length;
        }
        lanes[lane] = point.rate;
        return { ...point, lane: Math.min(lane, 4) };
      });
  });
  protected readonly spreadNote = computed(() => {
    const all = this.spread();
    const middle = all.filter((p) => p.rate >= 0.3 && p.rate < 0.95).length;
    return { total: all.length, middle };
  });
  protected percent(value: number): string {
    return formatPercent(value);
  }

  /** «Prüfstand»: each rule with what breaks it. */
  protected readonly checkRows = computed(() =>
    CHECKS.map((check) => {
      const items = this.list().filter((item) =>
        check.types.includes(item.hint.type),
      );
      const worst = items[0]?.hint.severity ?? null;
      return { ...check, items, worst };
    }),
  );
  protected readonly passed = computed(
    () => this.checkRows().filter((row) => !row.items.length).length,
  );
  protected readonly openChecks = signal<Set<string> | null>(null);
  protected isCheckOpen(id: string, failing: boolean): boolean {
    const open = this.openChecks();
    return open ? open.has(id) : failing;
  }
  protected toggleCheck(id: string, failing: boolean): void {
    const open = new Set(
      this.openChecks() ??
        this.checkRows()
          .filter((row) => row.items.length)
          .map((row) => row.id),
    );
    if (this.isCheckOpen(id, failing)) {
      open.delete(id);
    } else {
      open.add(id);
    }
    this.openChecks.set(open);
  }

  /** «Spielansicht»: the answers as players see them, with their share. */
  protected answersOf(question: AdminQuestion) {
    const picks = question.stats.picks;
    const total = picks.reduce((sum, n) => sum + n, 0) || 1;
    return question.options.map((text, index) => ({
      index,
      text,
      letter: 'ABCD'[index] ?? '',
      share: (picks[index] ?? 0) / total,
      correct: index === question.correctIndex,
    }));
  }

  /** «Messkarten»: the measured value against its limit. */
  protected gauge(hint: Hint, question: AdminQuestion | null) {
    const rate = question
      ? (share(question.stats.correct, question.stats.answers) ?? 0)
      : 0;
    switch (hint.type) {
      case 'lure':
        return {
          big: formatPercent(hint.value),
          caption: `wählen «${question?.options[hint.optionIndex ?? 0] ?? ''}»`,
          bars: [
            { label: 'Diese falsche Antwort', value: hint.value, tone: 'bad' },
            { label: 'Die richtige Antwort', value: rate, tone: 'ok' },
          ],
          limit: null,
        };
      case 'hard':
        return {
          big: formatPercent(hint.value),
          caption: 'antworten richtig',
          bars: [{ label: 'Richtig', value: hint.value, tone: 'bad' }],
          limit: { at: 0.3, label: 'mind. 30 %' },
        };
      case 'easy':
        return {
          big: formatPercent(hint.value),
          caption: 'antworten richtig',
          bars: [{ label: 'Richtig', value: hint.value, tone: 'warn' }],
          limit: { at: 0.95, label: 'unter 95 %' },
        };
      case 'timeouts':
        return {
          big: formatPercent(hint.value),
          caption: 'der Duelle ohne Antwort',
          bars: [{ label: 'Ohne Antwort', value: hint.value, tone: 'warn' }],
          limit: { at: 0.2, label: 'unter 20 %' },
        };
      default:
        return {
          big: formatInt(hint.value),
          caption: `aktive Fragen · Ziel ${formatInt(hint.sample)}`,
          bars: [
            {
              label: 'Aktiv',
              value: Math.min(1, hint.value / hint.sample),
              tone: hint.type === 'pool-empty' ? 'bad' : 'warn',
            },
          ],
          limit: null,
        };
    }
  }

  /** «Auswahl»: hints picked for one action at once. */
  protected readonly chosen = signal<Set<string>>(new Set());
  protected toggleChosen(key: string): void {
    const next = new Set(this.chosen());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.chosen.set(next);
  }
  protected clearChosen(): void {
    this.chosen.set(new Set());
  }
  protected chooseAll(): void {
    this.chosen.set(new Set(this.list().map((item) => item.hint.key)));
  }
  protected readonly chosenItems = computed(() =>
    this.list().filter((item) => this.chosen().has(item.hint.key)),
  );
  protected readonly chosenPausable = computed(
    () => this.chosenItems().filter((item) => item.question?.active).length,
  );
  protected bulkDone(what: string): void {
    const count = this.chosenItems().length;
    this.notify.success(
      `${count} ${count === 1 ? 'Hinweis' : 'Hinweise'} ${what} (Beispiel)`,
    );
    this.chosen.set(new Set());
  }

  /** «Matrix»: categories against what was found. */
  protected readonly category = signal<string | null>(null);
  protected readonly matrixCols: { id: HintType; label: string }[] = [
    { id: 'lure', label: 'Antwort lockt' },
    { id: 'hard', label: 'Zu schwer' },
    { id: 'easy', label: 'Zu leicht' },
    { id: 'timeouts', label: 'Zeit läuft ab' },
  ];
  protected readonly matrix = computed(() => {
    const pool = (
      this.sampled() ? SAMPLE_POOL : (this.data.questions.value() ?? [])
    ).filter((q) => q.active);
    const names = [
      ...new Set(pool.map((q) => q.category ?? 'Ohne Kategorie')),
    ].sort();
    const open = this.openList();
    return names.map((name) => ({
      name,
      count: pool.filter((q) => (q.category ?? 'Ohne Kategorie') === name).length,
      cells: this.matrixCols.map((col) => {
        const items = open.filter(
          (item) =>
            item.hint.type === col.id &&
            (item.question?.category ?? 'Ohne Kategorie') === name,
        );
        return {
          type: col.id,
          count: items.length,
          worst: items[0]?.hint.severity ?? null,
        };
      }),
    }));
  });
  protected pickCell(name: string, type: HintType): void {
    const same = this.category() === name && this.type() === type;
    this.tab.set('open');
    this.category.set(same ? null : name);
    this.type.set(same ? null : type);
  }

  /** «Entscheiden»: what was decided per hint, only on this page. */
  protected readonly decided = signal<Map<string, string>>(new Map());
  protected decisionOf(hint: Hint) {
    return DECISIONS[hint.type];
  }
  protected decide(
    item: { hint: Hint; question: AdminQuestion | null },
    choice: Choice,
  ): void {
    const next = new Map(this.decided());
    next.set(item.hint.key, choice.label);
    this.decided.set(next);
    if (choice.to === 'ignore') {
      void this.ignore(item.hint, true);
    } else if (choice.to === 'pause') {
      void this.pause(item.hint);
    } else if (!this.sampled()) {
      void this.router.navigate(
        choice.to === 'rules' ? ['/admin/regeln'] : ['/admin/fragen'],
        choice.to === 'rules'
          ? {}
          : {
              queryParams: {
                frage: choice.to === 'new' ? 'neu' : item.hint.questionId,
              },
            },
      );
    }
  }
  protected undecide(key: string): void {
    const next = new Map(this.decided());
    next.delete(key);
    this.decided.set(next);
  }

  /** «Nach Handlung»: the hints by what fixes them. */
  protected readonly plan = computed(() => {
    const list = this.list();
    return [
      {
        id: 'questions',
        title: 'Fragen überarbeiten',
        note: 'Formulierung, Antworten oder Schwierigkeit anpassen.',
        icon: 'edit',
        items: list.filter((item) => item.hint.questionId !== null),
      },
      {
        id: 'pool',
        title: 'Fragenbestand ausbauen',
        note: 'Mehr aktive Fragen für abwechslungsreiche Duelle.',
        icon: 'add',
        items: list.filter((item) => item.hint.questionId === null),
      },
      {
        id: 'rules',
        title: 'Spielregeln prüfen',
        note: 'Läuft die Zeit bei mehreren Fragen ab, hilft mehr Zeit pro Frage.',
        icon: 'time',
        items: list.filter((item) => item.hint.type === 'timeouts'),
      },
    ].filter((step) => step.items.length);
  });
  protected scrollTo(id: string): void {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** «Qualitätswert»: the share of judged questions nothing is wrong with. */
  protected readonly quality = computed(() => {
    const judged = (
      this.sampled() ? SAMPLE_POOL : (this.data.questions.value() ?? [])
    ).filter((q) => q.active && q.stats.answers >= 20).length;
    const flagged = this.affected();
    const value = judged ? (judged - flagged) / judged : null;
    const types = new Map<HintType, number>();
    for (const item of this.openList()) {
      if (item.hint.questionId !== null) {
        types.set(item.hint.type, (types.get(item.hint.type) ?? 0) + 1);
      }
    }
    return {
      judged,
      flagged,
      value,
      parts: [...types].map(([id, count]) => ({
        id,
        label: HINT_TYPE_LABELS[id],
        count,
        share: judged ? count / judged : 0,
      })),
      pool: this.openList().find((item) => item.hint.questionId === null) ?? null,
    };
  });
  protected ring(value: number | null): string {
    const length = 2 * Math.PI * 52;
    return `${(value ?? 0) * length} ${length}`;
  }

  /** «Suche»: a query, an order and how dense the list is. */
  protected readonly query = signal('');
  protected readonly sort = signal<'severity' | 'value' | 'id'>('severity');
  protected readonly dense = signal(false);
  protected readonly sortLabels = {
    severity: 'Wichtigkeit',
    value: 'Antworten',
    id: 'Frage-Nr.',
  };
  protected readonly found = computed(() => {
    const words = this.query().trim().toLowerCase();
    const list = this.list().filter(
      (item) =>
        !words ||
        [
          item.text.title,
          item.text.finding,
          item.question?.text ?? '',
          item.question ? 'f-' + item.question.id : '',
          HINT_TYPE_LABELS[item.hint.type],
        ]
          .join(' ')
          .toLowerCase()
          .includes(words),
    );
    const order = this.sort();
    return order === 'severity'
      ? list
      : [...list].sort((a, b) =>
          order === 'value'
            ? b.hint.sample - a.hint.sample
            : (a.hint.questionId ?? 0) - (b.hint.questionId ?? 0),
        );
  });
  /** The text cut where the query matches, to mark it. */
  protected parts(text: string): { text: string; hit: boolean }[] {
    const words = this.query().trim();
    if (!words) {
      return [{ text, hit: false }];
    }
    const at = text.toLowerCase().indexOf(words.toLowerCase());
    if (at < 0) {
      return [{ text, hit: false }];
    }
    return [
      { text: text.slice(0, at), hit: false },
      { text: text.slice(at, at + words.length), hit: true },
      { text: text.slice(at + words.length), hit: false },
    ];
  }

  /** «Direkt korrigieren»: an edit of the selected question, kept here. */
  protected readonly draft = signal<{
    key: string;
    text: string;
    options: string[];
    correct: number;
  } | null>(null);
  protected readonly resetStats = signal(true);
  protected readonly editing = computed(() => {
    const item = this.selected();
    const q = item?.question;
    if (!item || !q) {
      return null;
    }
    const draft = this.draft();
    return draft?.key === item.hint.key
      ? draft
      : {
          key: item.hint.key,
          text: q.text,
          options: [...q.options],
          correct: q.correctIndex,
        };
  });
  protected readonly edited = computed(() => {
    const item = this.selected();
    const draft = this.draft();
    const q = item?.question;
    return (
      !!q &&
      draft?.key === item?.hint.key &&
      (draft.text !== q.text ||
        draft.correct !== q.correctIndex ||
        draft.options.some((o, i) => o !== q.options[i]))
    );
  });
  protected editText(text: string): void {
    const e = this.editing();
    if (e) {
      this.draft.set({ ...e, text });
    }
  }
  protected editOption(index: number, text: string): void {
    const e = this.editing();
    if (e) {
      const options = [...e.options];
      options[index] = text;
      this.draft.set({ ...e, options });
    }
  }
  protected editCorrect(correct: number): void {
    const e = this.editing();
    if (e) {
      this.draft.set({ ...e, correct });
    }
  }
  protected saveEdit(): void {
    this.notify.success(
      this.resetStats()
        ? 'Frage gespeichert, Statistik zurückgesetzt (Beispiel)'
        : 'Frage gespeichert (Beispiel)',
    );
    this.draft.set(null);
  }

  /** «Tastatur»: one hint after the other, handled with a key. */
  protected readonly handled = signal<Map<string, string>>(new Map());
  protected readonly queue = computed(() =>
    this.list().filter((item) => !this.handled().has(item.hint.key)),
  );
  protected readonly current = computed(() => this.queue()[0] ?? null);
  protected handle(what: 'edit' | 'pause' | 'ignore' | 'skip'): void {
    const item = this.current();
    if (!item) {
      return;
    }
    const labels = {
      edit: 'Zum Bearbeiten vorgemerkt',
      pause: 'Pausiert',
      ignore: 'Ignoriert',
      skip: 'Übersprungen',
    };
    if (what === 'pause' && !item.question?.active) {
      return;
    }
    const next = new Map(this.handled());
    next.set(item.hint.key, labels[what]);
    this.handled.set(next);
  }
  protected resetHandled(): void {
    this.handled.set(new Map());
  }
  protected readonly handledList = computed(() =>
    this.list()
      .filter((item) => this.handled().has(item.hint.key))
      .map((item) => ({ item, what: this.handled().get(item.hint.key) ?? '' })),
  );
  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (this.face() !== 'h25' || event.metaKey || event.ctrlKey) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      return;
    }
    const keys: Record<string, 'edit' | 'pause' | 'ignore' | 'skip'> = {
      e: 'edit',
      p: 'pause',
      i: 'ignore',
      arrowright: 'skip',
    };
    const what = keys[event.key.toLowerCase()];
    if (what) {
      event.preventDefault();
      this.handle(what);
    }
  }

  /** «Jetzt und später»: what needs someone now, what can wait. */
  protected readonly now = computed(() =>
    this.list().filter((item) => item.hint.severity !== 'medium'),
  );
  protected readonly later = computed(() =>
    this.list().filter((item) => item.hint.severity === 'medium'),
  );

  /** «Prüfstand + Entscheiden»: a check picked on top filters the cards. */
  protected readonly checkFilter = signal<string | null>(null);
  protected readonly checkTypes = computed(
    () => CHECKS.find((check) => check.id === this.checkFilter())?.types ?? null,
  );

  /** «Entwicklung»: the last 14 days against the 14 before. */
  protected trendOf(question: AdminQuestion | null) {
    const now = question?.stats.recent;
    const before = question?.stats.previous;
    if (!now || !before || now.answers < 10 || before.answers < 10) {
      return null;
    }
    const a = before.correct / before.answers;
    const b = now.correct / now.answers;
    const diff = b - a;
    // A scale around both values, so the slope stays readable.
    const lo = Math.max(0, Math.min(a, b) - 0.1);
    const hi = Math.min(1, Math.max(a, b) + 0.1);
    const y = (v: number) => Math.round(60 - ((v - lo) / (hi - lo)) * 48);
    return {
      before: a,
      now: b,
      diff,
      verdict: Math.abs(diff) < 0.03 ? 'same' : diff < 0 ? 'worse' : 'better',
      y1: y(a),
      y2: y(b),
      points: `8,${y(a)} 152,${y(b)}`,
    };
  }
  protected readonly trends = computed(() => {
    const rows = this.list().map((item) => ({
      item,
      trend: this.trendOf(item.question),
    }));
    const rank = (r: (typeof rows)[number]) =>
      r.trend === null
        ? 3
        : r.trend.verdict === 'worse'
          ? 0
          : r.trend.verdict === 'same'
            ? 1
            : 2;
    return {
      rows: [...rows].sort((a, b) => rank(a) - rank(b)),
      worse: rows.filter((r) => r.trend?.verdict === 'worse').length,
      better: rows.filter((r) => r.trend?.verdict === 'better').length,
      same: rows.filter((r) => r.trend?.verdict === 'same').length,
    };
  });
  protected points(value: number): string {
    return `${Math.round(value * 100)} %`;
  }

  /** «Assistent»: three steps, from the overview to the summary. */
  protected readonly wizard = signal<1 | 2 | 3>(1);
  protected readonly undecided = computed(() =>
    this.list().filter((item) => !this.decided().has(item.hint.key)),
  );
  protected readonly decidedList = computed(() =>
    this.list()
      .filter((item) => this.decided().has(item.hint.key))
      .map((item) => ({ item, choice: this.decided().get(item.hint.key) ?? '' })),
  );
  protected decideStep(
    item: { hint: Hint; question: AdminQuestion | null },
    choice: Choice,
  ): void {
    this.decide(item, choice);
    if (!this.undecided().length) {
      this.wizard.set(3);
    }
  }
  protected skipStep(): void {
    const first = this.undecided()[0];
    if (first) {
      const next = new Map(this.decided());
      next.set(first.hint.key, 'Später');
      this.decided.set(next);
    }
    if (!this.undecided().length) {
      this.wizard.set(3);
    }
  }
  protected restartWizard(): void {
    this.decided.set(new Map());
    this.wizard.set(1);
  }
  protected readonly richDrawer = computed(() =>
    [
      'h30',
      'h31',
      'h32',
      'h38',
      'h39',
      'h40',
      'h41',
      'h42',
      'h43',
      'h44',
      'h45',
      'h47',
      'h48',
      'h50',
      'h53',
      'h55',
      'h56',
      'h57',
      'h58',
      'h59',
      'h60',
      'h61',
      'h62',
      'h63',
      'h64',
      'h65',
      'h66',
      'h67',
      'h68',
      'h69',
      'h70',
      'h71',
      'h72',
      'h73',
      'n1',
      'n2',
      'n3',
      'n4',
      'n5',
    ].includes(this.face()),
  );

  /** Runde 7: every judged question as one square, the flagged ones first. */
  protected readonly waffle = computed(() => {
    const pool = (
      this.sampled() ? SAMPLE_POOL : (this.data.questions.value() ?? [])
    ).filter((q) => q.active && q.stats.answers >= 20);
    const worst = new Map<number, HintSeverity>();
    for (const item of this.openList()) {
      const id = item.hint.questionId;
      if (id !== null && !worst.has(id)) {
        worst.set(id, item.hint.severity);
      }
    }
    return pool
      .map((q) => ({ id: q.id, severity: worst.get(q.id) ?? null }))
      .sort(
        (a, b) =>
          (a.severity ? SEVERITY_ORDER[a.severity] : 9) -
          (b.severity ? SEVERITY_ORDER[b.severity] : 9),
      );
  });

  /** Runde 7: a hint as a task, verb first, with what it costs the game. */
  protected taskOf(hint: Hint): { task: string; impact: string } {
    const id = hint.questionId === null ? '' : `F-${hint.questionId} `;
    const q = this.questionOf(hint.questionId);
    switch (hint.type) {
      case 'lure':
        return {
          task: `${id}eindeutiger formulieren`,
          impact: `${formatPercent(hint.value)} wählen «${q?.options[hint.optionIndex ?? 0] ?? ''}»`,
        };
      case 'hard':
        return {
          task: `${id}vereinfachen`,
          impact: `nur ${formatPercent(hint.value)} richtig`,
        };
      case 'easy':
        return {
          task: `${id}schwieriger machen`,
          impact: `${formatPercent(hint.value)} richtig`,
        };
      case 'timeouts':
        return {
          task: `${id}kürzen`,
          impact: `${formatPercent(hint.value)} ohne Antwort`,
        };
      case 'pool-small':
        return {
          task: 'Fragenbestand ausbauen',
          impact: `${formatInt(hint.value)} von ${formatInt(hint.sample)} empfohlenen Fragen`,
        };
      case 'pool-empty':
        return {
          task: 'Fragen aktivieren oder erfassen',
          impact: `${formatInt(hint.value)} von ${formatInt(hint.sample)} nötigen Fragen`,
        };
    }
  }

  /** Runde 7: the quality of each category. */
  protected readonly categoryScores = computed(() => {
    const pool = (
      this.sampled() ? SAMPLE_POOL : (this.data.questions.value() ?? [])
    ).filter((q) => q.active && q.stats.answers >= 20);
    const flagged = new Set(
      this.openList()
        .map((item) => item.hint.questionId)
        .filter((id): id is number => id !== null),
    );
    const names = [...new Set(pool.map((q) => q.category ?? 'Ohne Kategorie'))];
    return names
      .map((name) => {
        const inCat = pool.filter((q) => (q.category ?? 'Ohne Kategorie') === name);
        const bad = inCat.filter((q) => flagged.has(q.id)).length;
        return {
          name,
          total: inCat.length,
          bad,
          score: inCat.length ? (inCat.length - bad) / inCat.length : 1,
        };
      })
      .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
  });

  protected groupItems(severity: HintSeverity) {
    return this.list().filter((item) => item.hint.severity === severity);
  }
  protected whenOf(severity: HintSeverity): string {
    return { critical: 'Sofort', high: 'Diese Woche', medium: 'Bei Gelegenheit' }[
      severity
    ];
  }
  protected priorityOf(severity: HintSeverity): string {
    return { critical: 'Sofort', high: 'Hoch', medium: 'Normal' }[severity];
  }

  /** Runde 7: the steps of work, with what they hold. */
  protected readonly work = computed(() => {
    const list = this.list();
    const questions = list.filter((item) => item.hint.questionId !== null);
    const pool = list.filter((item) => item.hint.questionId === null);
    return [
      {
        id: 'questions',
        icon: 'edit',
        title: 'Fragen überarbeiten',
        note:
          questions.length === 1
            ? '1 Frage verwirrt oder ist unausgewogen.'
            : `${questions.length} Fragen verwirren oder sind unausgewogen.`,
        items: questions,
      },
      {
        id: 'pool',
        icon: 'add',
        title: 'Fragenbestand ausbauen',
        note: pool[0]?.text.finding ?? '',
        items: pool,
      },
    ]
      .filter((step) => step.items.length)
      .sort(
        (a, b) =>
          SEVERITY_ORDER[a.items[0]?.hint.severity ?? 'medium'] -
          SEVERITY_ORDER[b.items[0]?.hint.severity ?? 'medium'],
      );
  });

  /** Runde 8: the finding as one big number and the sentence after it. */
  protected factOf(hint: Hint): {
    big: string;
    rest: string;
    fix: string;
    cta: string;
    to: 'edit' | 'new';
  } {
    const q = this.questionOf(hint.questionId);
    const right = q?.options[q.correctIndex] ?? '';
    switch (hint.type) {
      case 'lure':
        return {
          big: formatPercent(hint.value),
          rest: `wählen «${q?.options[hint.optionIndex ?? 0] ?? ''}» statt «${right}».`,
          fix: 'Prüfen, ob die Frage eindeutig ist. Oft hilft eine genauere Formulierung.',
          cta: 'Frage klarer stellen',
          to: 'edit',
        };
      case 'hard':
        return {
          big: formatPercent(hint.value),
          rest: 'antworten richtig – zufällig wären es 25\u00a0%.',
          fix: 'Vereinfachen oder einen Hinweis in die Frage nehmen.',
          cta: 'Frage vereinfachen',
          to: 'edit',
        };
      case 'easy':
        return {
          big: formatPercent(hint.value),
          rest: 'antworten richtig – die Frage entscheidet kein Duell.',
          fix: 'Die falschen Antworten plausibler machen.',
          cta: 'Antworten verbessern',
          to: 'edit',
        };
      case 'timeouts':
        return {
          big: formatPercent(hint.value),
          rest: 'der Duelle enden hier ohne Antwort.',
          fix: 'Frage und Antworten kürzen – oder mehr Zeit pro Frage geben.',
          cta: 'Frage kürzen',
          to: 'edit',
        };
      case 'pool-small':
        return {
          big: formatInt(hint.value),
          rest: `aktive Fragen – empfohlen sind ${formatInt(hint.sample)}.`,
          fix: 'Mit mehr Fragen sehen Spielende seltener dieselbe Frage.',
          cta: 'Fragen erfassen',
          to: 'new',
        };
      case 'pool-empty':
        return {
          big: formatInt(hint.value),
          rest: `aktive Fragen – ein Duell braucht ${formatInt(hint.sample)}.`,
          fix: 'Bis genug Fragen aktiv sind, starten keine Duelle.',
          cta: 'Fragen erfassen',
          to: 'new',
        };
    }
  }

  /** Runde 8: where the value stands on its scale, with the healthy band. */
  protected scaleOf(hint: Hint): {
    label: string;
    band: [number, number] | null;
    marks: { at: number; tone: 'bad' | 'ok'; label: string }[];
    ticks: string[];
  } {
    const q = this.questionOf(hint.questionId);
    const rate = q ? (share(q.stats.correct, q.stats.answers) ?? 0) : 0;
    switch (hint.type) {
      case 'lure':
        return {
          label: 'Anteil der Antworten',
          band: null,
          marks: [
            {
              at: hint.value,
              tone: 'bad',
              label: `${formatPercent(hint.value)} falsch`,
            },
            { at: rate, tone: 'ok', label: `${formatPercent(rate)} richtig` },
          ],
          ticks: ['0', '50', '100 %'],
        };
      case 'hard':
      case 'easy':
        return {
          label: 'Richtige Antworten',
          band: [0.3, 0.95],
          marks: [{ at: hint.value, tone: 'bad', label: formatPercent(hint.value) }],
          ticks: ['0', '50', '100 %'],
        };
      case 'timeouts':
        return {
          label: 'Ohne Antwort',
          band: [0, 0.2],
          marks: [{ at: hint.value, tone: 'bad', label: formatPercent(hint.value) }],
          ticks: ['0', '50', '100 %'],
        };
      default:
        return {
          label: 'Aktive Fragen',
          band: null,
          ticks: ['0', '', `Ziel ${formatInt(hint.sample)}`],
          marks: [
            {
              at: Math.min(1, hint.value / hint.sample),
              tone: 'bad',
              label: `${formatInt(hint.value)} von ${formatInt(hint.sample)}`,
            },
          ],
        };
    }
  }

  protected act(item: { hint: Hint }): void {
    const fact = this.factOf(item.hint);
    if (this.sampled()) {
      this.notify.success(`${fact.cta} (Beispiel)`);
      return;
    }
    void this.router.navigate(['/admin/fragen'], {
      queryParams: { frage: fact.to === 'new' ? 'neu' : item.hint.questionId },
    });
  }

  /** Runde 8: the headline over everything. */
  protected readonly summary = computed(() => {
    const q = this.quality();
    const c = this.severityCounts();
    const urgent = c.critical + c.high;
    if (c.critical) {
      return {
        lead: 'Duelle können gerade nicht starten.',
        rest: 'Zuerst müssen genug Fragen aktiv sein.',
      };
    }
    if (!this.counts().open) {
      return q.judged
        ? {
            lead: `Alle ${q.judged} beurteilten Fragen sind in Ordnung.`,
            rest: 'Nichts zu tun.',
          }
        : {
            lead: 'Noch nichts zu beurteilen.',
            rest: 'Eine Frage wird ab 20 Antworten geprüft.',
          };
    }
    return {
      lead: q.judged
        ? `Bei ${q.flagged} von ${q.judged} Fragen stimmt etwas nicht.`
        : `${this.counts().open} Hinweise sind offen.`,
      rest: urgent
        ? `${urgent === 1 ? 'Eine davon' : urgent + ' davon'} solltest du bald ansehen.`
        : 'Nichts davon eilt.',
    };
  });

  /** Runde 9: built like the approved pages. */
  protected readonly r9 = computed(() =>
    [
      'h43',
      'h44',
      'h45',
      'h46',
      'h47',
      'h48',
      'h49',
      'h50',
      'h51',
      'h52',
      'h53',
      'h54',
      'h55',
      'h56',
      'h57',
      'h58',
      'h59',
      'h60',
      'h61',
      'h62',
      'h63',
      'h64',
      'h65',
      'h66',
      'h67',
      'h68',
      'h69',
      'h70',
      'h71',
      'h72',
      'h73',
      'n1',
      'n2',
      'n3',
      'n4',
      'n5',
    ].includes(this.face()),
  );
  /** Runde 14: the averages of all judged questions, to compare with. */
  private readonly judgedPool = computed(() =>
    (this.sampled() ? SAMPLE_POOL : (this.data.questions.value() ?? [])).filter(
      (q) => q.active && q.stats.answers >= 20,
    ),
  );
  protected readonly averages = computed(() => {
    const pool = this.judgedPool();
    const n = pool.length || 1;
    const rate =
      pool.reduce((sum, q) => sum + q.stats.correct / q.stats.answers, 0) / n;
    const timeouts =
      pool.reduce(
        (sum, q) => sum + q.stats.timeouts / (q.stats.answers + q.stats.timeouts),
        0,
      ) / n;
    const ms = pool.reduce((sum, q) => sum + (q.stats.avgAnswerMs ?? 0), 0) / n;
    return { rate, timeouts, ms, count: pool.length };
  });
  protected statsOf(question: AdminQuestion) {
    const shown = question.stats.answers + question.stats.timeouts;
    return {
      rate: question.stats.correct / Math.max(1, question.stats.answers),
      timeouts: shown ? question.stats.timeouts / shown : 0,
      seconds: (question.stats.avgAnswerMs ?? 0) / 1000,
      answers: question.stats.answers,
    };
  }
  protected seconds(ms: number): string {
    return `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
  }

  /** Runde 14: the hints by theme. */
  protected readonly themes = computed(() => {
    const open = this.openList();
    const defs: {
      id: string;
      title: string;
      text: string;
      icon: string;
      types: HintType[];
    }[] = [
      {
        id: 'clear',
        title: 'Verständlichkeit',
        text: 'Spielende werden in die Irre geführt.',
        icon: 'target',
        types: ['lure'],
      },
      {
        id: 'level',
        title: 'Schwierigkeit',
        text: 'Zu schwer oder zu leicht für ein spannendes Duell.',
        icon: 'statistic',
        types: ['hard', 'easy'],
      },
      {
        id: 'time',
        title: 'Zeit',
        text: 'Die Zeit reicht nicht zum Lesen und Antworten.',
        icon: 'time',
        types: ['timeouts'],
      },
      {
        id: 'pool',
        title: 'Fragenbestand',
        text: 'Genug Fragen für Abwechslung.',
        icon: 'items-list',
        types: ['pool-small', 'pool-empty'],
      },
    ];
    return defs.map((d) => ({
      ...d,
      items: open.filter((item) => d.types.includes(item.hint.type)),
    }));
  });
  protected readonly theme = signal<string | null>(null);
  protected readonly themeItems = computed(() => {
    const id = this.theme();
    const all = this.tab() === 'open' ? this.openList() : this.list();
    const def = this.themes().find((t) => t.id === id);
    return def ? all.filter((item) => def.types.includes(item.hint.type)) : all;
  });

  /** Runde 14: a goal for the quality of all questions. */
  protected readonly goal = computed(() => {
    const q = this.quality();
    const target = 0.95;
    const allowed = Math.floor(q.judged * (1 - target));
    return {
      target,
      reached: q.value !== null && q.value >= target,
      needed: Math.max(0, q.flagged - allowed),
      value: q.value,
    };
  });

  /** Runde 14: a tab inside each opened hint. */
  protected readonly innerTab = signal<Map<string, 'answers' | 'compare' | 'fix'>>(
    new Map(),
  );
  protected tabOf(key: string): 'answers' | 'compare' | 'fix' {
    return this.innerTab().get(key) ?? 'answers';
  }
  protected setInner(key: string, tab: 'answers' | 'compare' | 'fix'): void {
    const next = new Map(this.innerTab());
    next.set(key, tab);
    this.innerTab.set(next);
  }

  protected readonly innerTabs: {
    id: 'answers' | 'compare' | 'fix';
    label: string;
  }[] = [
    { id: 'answers', label: 'Antworten' },
    { id: 'compare', label: 'Im Vergleich' },
    { id: 'fix', label: 'Lösung' },
  ];
  protected themeTitle(): string {
    return (
      this.themes().find((t) => t.id === this.theme())?.title ?? 'Alle Hinweise'
    );
  }
  protected gainOf(): string {
    const judged = this.quality().judged;
    return judged ? formatPercent(1 / judged) : '';
  }
  protected compareRows(st: { rate: number; timeouts: number; seconds: number }) {
    const avg = this.averages();
    const maxS = Math.max(st.seconds, avg.ms / 1000, 1);
    return [
      {
        label: 'Richtig',
        self: st.rate,
        avg: avg.rate,
        selfText: formatPercent(st.rate),
        avgText: formatPercent(avg.rate),
        bad: st.rate < 0.3 || st.rate >= 0.95,
      },
      {
        label: 'Ohne Antwort',
        self: st.timeouts,
        avg: avg.timeouts,
        selfText: formatPercent(st.timeouts),
        avgText: formatPercent(avg.timeouts),
        bad: st.timeouts >= 0.2,
      },
      {
        label: 'Zeit',
        self: st.seconds / maxS,
        avg: avg.ms / 1000 / maxS,
        selfText: this.seconds(st.seconds * 1000),
        avgText: this.seconds(avg.ms),
        bad: false,
      },
    ];
  }

  /** Runde 15, «Fluss»: why it happens, in one sentence. */
  protected causeOf(hint: Hint): string {
    return {
      lure: 'Die Frage lässt mehrere Deutungen zu, oder die falsche Antwort wirkt plausibler.',
      hard: 'Das Wissen ist selten, oder die Frage ist kompliziert gestellt.',
      easy: 'Die falschen Antworten sind zu offensichtlich.',
      timeouts: 'Frage und Antworten sind zu lang, um sie in der Zeit zu lesen.',
      'pool-small': 'Es sind zu wenige Fragen aktiv für abwechslungsreiche Duelle.',
      'pool-empty': 'Es sind weniger Fragen aktiv, als ein Duell braucht.',
    }[hint.type];
  }

  /** Runde 15, «Prüfmatrix»: every flagged question against every check. */
  protected readonly checkMatrix = computed(() => {
    const items = this.list().filter((item) => item.question);
    const seen = new Map<number, typeof items>();
    for (const item of items) {
      const id = item.hint.questionId ?? 0;
      seen.set(id, [...(seen.get(id) ?? []), item]);
    }
    return [...seen].map(([id, group]) => {
      const q = group[0]!.question!;
      const st = this.statsOf(q);
      const types = new Set(group.map((g) => g.hint.type));
      const picks = q.stats.picks;
      const total = picks.reduce((a, b) => a + b, 0) || 1;
      const lure = Math.max(
        0,
        ...picks.filter((_, i) => i !== q.correctIndex).map((p) => p / total),
      );
      return {
        id,
        question: q,
        first: group[0]!,
        worst: group[0]!.hint.severity,
        cells: [
          {
            label: 'Keine Antwort lockt',
            bad: types.has('lure'),
            value: formatPercent(lure),
          },
          {
            label: 'Nicht zu schwer',
            bad: types.has('hard'),
            value: formatPercent(st.rate),
          },
          {
            label: 'Nicht zu leicht',
            bad: types.has('easy'),
            value: formatPercent(st.rate),
          },
          {
            label: 'Die Zeit reicht',
            bad: types.has('timeouts'),
            value: formatPercent(st.timeouts),
          },
        ],
      };
    });
  });
  protected readonly matrixHeads = [
    'Keine Antwort lockt',
    'Nicht zu schwer',
    'Nicht zu leicht',
    'Die Zeit reicht',
  ];

  /** Runde 15, «Zeugnis»: a Swiss grade from 1 to 6, in half steps. */
  protected gradeOf(score: number): string {
    const grade = Math.round((1 + score * 5) * 2) / 2;
    return grade.toFixed(1).replace('.', ',').replace(',0', '');
  }
  protected gradeTone(score: number): string {
    return score >= 0.9 ? 'good' : score >= 0.7 ? 'fair' : 'poor';
  }

  /** Runde 15, «Checkliste»: hints ticked off on this page. */
  protected readonly ticked = signal<Set<string>>(new Set());
  protected tick(key: string): void {
    const next = new Set(this.ticked());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.ticked.set(next);
  }
  protected readonly todo = computed(() =>
    this.list().filter((item) => !this.ticked().has(item.hint.key)),
  );
  protected readonly done = computed(() =>
    this.list().filter((item) => this.ticked().has(item.hint.key)),
  );

  protected stackOf(item: { hint: Hint; question: AdminQuestion | null }) {
    const q = item.question;
    if (!q) {
      return [];
    }
    const picks = q.stats.picks;
    const total = picks.reduce((a, b) => a + b, 0) + q.stats.timeouts || 1;
    const lure = item.hint.type === 'lure' ? (item.hint.optionIndex ?? 0) : -1;
    const segs = q.options.map((text, index) => ({
      letter: 'ABCD'[index] ?? '',
      label: text,
      share: (picks[index] ?? 0) / total,
      kind: index === q.correctIndex ? 'ok' : index === lure ? 'lure' : 'other',
    }));
    segs.push({
      letter: '',
      label: 'Ohne Antwort',
      share: q.stats.timeouts / total,
      kind: 'time',
    });
    return segs.filter((seg) => seg.share > 0);
  }

  /** Runde 16, «Dialog»: the conversation up to the first open question. */
  protected readonly dialog = computed(() => {
    const list = this.list();
    const rows: { item: (typeof list)[number]; answer: string | null }[] = [];
    for (const item of list) {
      const answer = this.decided().get(item.hint.key) ?? null;
      rows.push({ item, answer });
      if (!answer) {
        break;
      }
    }
    return rows;
  });
  protected resetDecided(): void {
    this.decided.set(new Map());
  }
  protected readonly dialogDone = computed(
    () =>
      this.list().length > 0 &&
      this.list().every((item) => this.decided().has(item.hint.key)),
  );

  /** Runde 16, «Tachos»: the arc of a gauge from 0 to 1. */
  protected arc(from: number, to: number): string {
    const point = (v: number) => {
      const a = Math.PI * (1 - Math.min(1, Math.max(0, v)));
      return `${(60 + 50 * Math.cos(a)).toFixed(2)} ${(60 - 50 * Math.sin(a)).toFixed(2)}`;
    };
    return `M ${point(from)} A 50 50 0 0 1 ${point(to)}`;
  }
  protected needle(v: number): { x: number; y: number } {
    const a = Math.PI * (1 - Math.min(1, Math.max(0, v)));
    return { x: 60 + 40 * Math.cos(a), y: 60 - 40 * Math.sin(a) };
  }

  /** Runde 16, «Radar»: four values of a question against the average. */
  protected radarOf(question: AdminQuestion) {
    const st = this.statsOf(question);
    const avg = this.averages();
    const picks = question.stats.picks;
    const total = picks.reduce((a, b) => a + b, 0) || 1;
    const lure = Math.max(
      0,
      ...picks.filter((_, i) => i !== question.correctIndex).map((p) => p / total),
    );
    const self = [
      st.rate,
      Math.min(1, st.timeouts * 2),
      Math.min(1, st.seconds / 20),
      lure,
    ];
    const base = [
      avg.rate,
      Math.min(1, avg.timeouts * 2),
      Math.min(1, avg.ms / 20000),
      0.2,
    ];
    const poly = (values: number[]) =>
      values
        .map((v, i) => {
          const a = (Math.PI / 2) * i - Math.PI / 2;
          const r = 8 + 56 * v;
          return `${(80 + r * Math.cos(a)).toFixed(1)},${(80 + r * Math.sin(a)).toFixed(1)}`;
        })
        .join(' ');
    return {
      self: poly(self),
      base: poly(base),
      labels: [
        { text: 'Richtig', value: formatPercent(st.rate), x: 80, y: 8 },
        { text: 'Ohne Antwort', value: formatPercent(st.timeouts), x: 152, y: 84 },
        { text: 'Zeit', value: this.seconds(st.seconds * 1000), x: 80, y: 160 },
        { text: 'Lockt', value: formatPercent(lure), x: 8, y: 84 },
      ],
    };
  }

  /** Neu: the share of judged questions that pass each check. */
  protected readonly health = computed(() => {
    const judged = this.quality().judged;
    const rows = this.checkRows().filter((row) => row.id !== 'pool');
    return rows.map((row) => {
      const bad = new Set(row.items.map((item) => item.hint.questionId)).size;
      return {
        ...row,
        bad,
        share: judged ? (judged - bad) / judged : 1,
      };
    });
  });
  protected readonly byCategory = computed(() => {
    const items = this.list();
    const names = [
      ...new Set(items.map((item) => item.question?.category ?? 'Fragenbestand')),
    ];
    return names.map((name) => ({
      name,
      items: items.filter(
        (item) => (item.question?.category ?? 'Fragenbestand') === name,
      ),
      total: this.categoryScores().find((cat) => cat.name === name)?.total ?? null,
    }));
  });
  protected readonly calmCategories = computed(() => {
    const busy = new Set(this.byCategory().map((group) => group.name));
    return this.categoryScores().filter((cat) => !busy.has(cat.name));
  });
  protected setView(severity: HintSeverity | null, ignored = false): void {
    this.tab.set(ignored ? 'ignored' : 'open');
    this.type.set(null);
    this.category.set(null);
    this.severity.set(severity);
  }

  /** Neu: every hint with its question, the urgent first. */
  protected readonly isNext = computed(() =>
    ['v', 'w', 'x', 'b', 'c', 'd', 'p', 'z', 'y', 'q', 'r', 's', 't'].includes(
      this.face().charAt(0),
    ),
  );
  protected readonly nextItems = computed(() =>
    [...(this.allHints() ?? [])]
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      .map((hint) => this.describe(hint)),
  );
  protected readonly spreadPoints = computed(() =>
    this.spread().map((point) => ({
      id: point.id,
      text: point.text,
      category: point.category,
      rate: point.rate,
      time: point.time,
      lead: point.lead,
      severity: point.hint?.severity ?? null,
      flagged: point.hint !== null,
    })),
  );
  protected ignoreMany(items: { hint: Hint }[], ignored: boolean): void {
    for (const item of items) {
      void this.ignore(item.hint, ignored);
    }
  }
  protected pauseMany(items: { hint: Hint }[]): void {
    for (const item of items) {
      void this.pause(item.hint);
    }
  }

  protected setFaceTo(face: string): void {
    setFacelift(face);
  }
  protected slide(direction: 1 | -1): void {
    const rail = document.getElementById('strip-rail');
    rail?.scrollBy({ left: direction * 560, behavior: 'smooth' });
  }
  protected readonly r10 = computed(() =>
    [
      'h47',
      'h48',
      'h49',
      'h50',
      'h51',
      'h52',
      'h53',
      'h54',
      'h55',
      'h56',
      'h57',
      'h58',
      'h59',
      'h60',
      'h61',
      'h62',
      'h63',
      'h64',
      'h65',
      'h66',
      'h67',
      'h68',
      'h69',
      'h70',
      'h71',
      'h72',
      'h73',
      'n1',
      'n2',
      'n3',
      'n4',
      'n5',
    ].includes(this.face()),
  );

  /** Runde 11, «Wie Linear»: move through the list with j and k. */
  @HostListener('document:keydown', ['$event'])
  protected onListKey(event: KeyboardEvent): void {
    if (this.face() !== 'h51' || event.metaKey || event.ctrlKey) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'j' || key === 'arrowdown') {
      event.preventDefault();
      this.step(1);
    } else if (key === 'k' || key === 'arrowup') {
      event.preventDefault();
      this.step(-1);
    } else if (key === 'e' && this.selected()) {
      event.preventDefault();
      this.act(this.selected()!);
    }
  }

  /** Runde 11, «Wie Stripe»: why a hint was raised, rule by rule. */
  protected factorsOf(hint: Hint): { label: string; value: string; met: boolean }[] {
    const q = this.questionOf(hint.questionId);
    const rate = q ? (share(q.stats.correct, q.stats.answers) ?? 0) : 0;
    const shown = q ? q.stats.answers + q.stats.timeouts : 0;
    switch (hint.type) {
      case 'lure':
        return [
          {
            label: 'Genug Antworten für ein Urteil',
            value: `${formatInt(hint.sample)} von mind. 20`,
            met: false,
          },
          {
            label: 'Eine falsche Antwort holt mind. 30 %',
            value: formatPercent(hint.value),
            met: true,
          },
          {
            label: 'Sie wird öfter gewählt als die richtige',
            value: `${formatPercent(hint.value)} gegen ${formatPercent(rate)}`,
            met: true,
          },
        ];
      case 'hard':
        return [
          {
            label: 'Genug Antworten für ein Urteil',
            value: `${formatInt(hint.sample)} von mind. 20`,
            met: false,
          },
          {
            label: 'Weniger als 30 % antworten richtig',
            value: formatPercent(hint.value),
            met: true,
          },
        ];
      case 'easy':
        return [
          {
            label: 'Genug Antworten für ein Urteil',
            value: `${formatInt(hint.sample)} von mind. 30`,
            met: false,
          },
          {
            label: 'Mindestens 95 % antworten richtig',
            value: formatPercent(hint.value),
            met: true,
          },
        ];
      case 'timeouts':
        return [
          {
            label: 'Oft genug gestellt',
            value: `${formatInt(shown)}-mal von mind. 20`,
            met: false,
          },
          {
            label: 'In mind. 20 % läuft die Zeit ab',
            value: formatPercent(hint.value),
            met: true,
          },
        ];
      default:
        return [
          { label: 'Aktive Fragen', value: formatInt(hint.value), met: false },
          {
            label:
              hint.type === 'pool-empty'
                ? 'Weniger, als ein Duell braucht'
                : 'Weniger als empfohlen',
            value: `Ziel ${formatInt(hint.sample)}`,
            met: true,
          },
        ];
    }
  }

  /** Runde 11, «Karte der Fragen»: every judged question as one point. */
  protected readonly plotPoints = computed(() => {
    const pool = (
      this.sampled() ? SAMPLE_POOL : (this.data.questions.value() ?? [])
    ).filter((q) => q.active && q.stats.answers >= 20);
    const flagged = new Map(
      this.openList()
        .filter((item) => item.hint.questionId !== null)
        .map((item) => [item.hint.questionId, item]),
    );
    return pool.map((q) => {
      const shown = q.stats.answers + q.stats.timeouts;
      const item = flagged.get(q.id) ?? null;
      return {
        id: q.id,
        x: q.stats.correct / q.stats.answers,
        y: shown ? q.stats.timeouts / shown : 0,
        item,
      };
    });
  });
  /** The y axis runs to 50 % of duels without an answer. */
  protected plotY(y: number): number {
    return 3 + Math.min(1, y / 0.5) * 94;
  }
  protected readonly panel = signal<'list' | 'checks'>('list');
  protected checkLabel(): string {
    return CHECKS.find((check) => check.id === this.checkFilter())?.label ?? '';
  }
  protected readonly closedTiers = signal<Set<HintSeverity>>(new Set());
  protected toggleTier(id: HintSeverity): void {
    const next = new Set(this.closedTiers());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.closedTiers.set(next);
  }
  protected foundOf(severity: HintSeverity) {
    return this.found().filter((item) => item.hint.severity === severity);
  }
  protected readonly scopeOptions: {
    id: 'all' | 'questions' | 'pool';
    label: string;
  }[] = [
    { id: 'all', label: 'Alle' },
    { id: 'questions', label: 'Einzelne Fragen' },
    { id: 'pool', label: 'Bestand' },
  ];
  protected readonly scope = signal<'all' | 'questions' | 'pool'>('all');
  protected readonly view = signal<'list' | 'cards'>('list');
  protected readonly scoped = computed(() =>
    this.list().filter(
      (item) =>
        this.scope() === 'all' ||
        (this.scope() === 'pool') === (item.hint.questionId === null),
    ),
  );
  protected readonly kindCounts = computed(() => {
    const open = this.openList();
    const counts = new Map<HintType, number>();
    for (const item of open) {
      counts.set(item.hint.type, (counts.get(item.hint.type) ?? 0) + 1);
    }
    const total = Math.max(1, open.length);
    return [...counts]
      .map(([id, count]) => ({
        id,
        label: HINT_TYPE_LABELS[id],
        count,
        share: count / total,
      }))
      .sort((a, b) => b.count - a.count);
  });

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.drawer.set(null);
  }

  protected toggle(key: string): void {
    this.expanded.set(this.expanded() === key ? null : key);
  }

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const key = params.get('hinweis');
        if (key) {
          this.selectedKey.set(key);
          const hint = this.allHints()?.find((h) => h.key === key);
          if (hint?.ignored) {
            this.tab.set('ignored');
          }
        }
      });
  }

  protected readonly counts = computed(() => {
    const all = this.allHints() ?? [];
    return {
      open: all.filter((hint) => !hint.ignored).length,
      ignored: all.filter((hint) => hint.ignored).length,
    };
  });

  private readonly inTab = computed(() =>
    (this.allHints() ?? []).filter(
      (hint) => hint.ignored === (this.tab() === 'ignored'),
    ),
  );

  protected readonly types = computed(() => {
    const counts = new Map<HintType, number>();
    for (const hint of this.inTab()) {
      counts.set(hint.type, (counts.get(hint.type) ?? 0) + 1);
    }
    return [...counts].map(([id, count]) => ({
      id,
      count,
      label: HINT_TYPE_LABELS[id],
    }));
  });

  protected readonly list = computed(() =>
    this.inTab()
      .filter((hint) => this.type() === null || hint.type === this.type())
      .filter(
        (hint) => this.severity() === null || hint.severity === this.severity(),
      )
      .filter(
        (hint) =>
          this.checkTypes() === null || !!this.checkTypes()?.includes(hint.type),
      )
      .filter(
        (hint) =>
          this.category() === null ||
          (this.questionOf(hint.questionId)?.category ?? 'Ohne Kategorie') ===
            this.category(),
      )
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      .map((hint) => this.describe(hint)),
  );

  protected readonly selected = computed(() => {
    const list = this.list();
    const key = this.selectedKey();
    return list.find((item) => item.hint.key === key) ?? list[0] ?? null;
  });

  protected setTab(tab: 'open' | 'ignored'): void {
    this.tab.set(tab);
    this.type.set(null);
    this.severity.set(null);
    this.category.set(null);
    this.checkFilter.set(null);
    this.chosen.set(new Set());
    this.select(null);
  }

  /** From the list: show the detail, which sits below the list on narrow screens. */
  protected open(key: string): void {
    this.select(key);
    if (window.matchMedia('(max-width: 1024px)').matches) {
      setTimeout(() =>
        document
          .querySelector('.detail')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  }

  protected select(key: string | null): void {
    this.selectedKey.set(key);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { hinweis: key },
      replaceUrl: true,
    });
  }

  private describe(hint: Hint) {
    const question = this.questionOf(hint.questionId);
    const stats = question?.stats;
    return {
      hint,
      question,
      text: hintText(hint, question),
      rate: stats ? formatPercent(share(stats.correct, stats.answers)) : null,
    };
  }

  protected async ignore(hint: Hint, ignored: boolean): Promise<void> {
    if (this.sampled()) {
      this.notify.success(
        ignored
          ? 'Hinweis ignoriert (Beispiel)'
          : 'Hinweis ist wieder offen (Beispiel)',
      );
      return;
    }
    this.busy.set(true);
    try {
      if (ignored) {
        await this.api.ignoreHint(hint.key);
      } else {
        await this.api.restoreHint(hint.key);
      }
      await this.data.hints.reload();
      this.notify.success(
        ignored ? 'Hinweis ignoriert' : 'Hinweis ist wieder offen',
        ignored
          ? { label: 'Rückgängig', run: () => void this.ignore(hint, false) }
          : undefined,
      );
      this.select(null);
    } catch (error) {
      this.notify.error(messageOf(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async pause(hint: Hint): Promise<void> {
    if (hint.questionId === null) {
      return;
    }
    const id = hint.questionId;
    if (this.sampled()) {
      this.notify.success(`F-${id} pausiert (Beispiel)`);
      return;
    }
    this.busy.set(true);
    try {
      await this.api.bulk({ ids: [id], action: 'deactivate' });
      await this.data.reloadQuestions();
      this.notify.success(`F-${id} pausiert – kommt in keinem Duell mehr vor`, {
        label: 'Rückgängig',
        run: () =>
          void this.api
            .bulk({ ids: [id], action: 'activate' })
            .then(() => this.data.reloadQuestions()),
      });
      this.select(null);
    } catch (error) {
      this.notify.error(messageOf(error));
    } finally {
      this.busy.set(false);
    }
  }
}
