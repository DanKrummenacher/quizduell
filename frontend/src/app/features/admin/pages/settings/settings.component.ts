import {
  Component,
  computed,
  DestroyRef,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  HostListener,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import type {
  AdminSettings,
  AuditEntry,
  NumericSettingKey,
} from '../../../../core/contracts/admin.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { ConfirmService } from '../../core/confirm.service';
import {
  formatDateTime,
  formatDuration,
  formatInt,
  formatRelative,
  formatSeconds,
} from '../../core/format';
import { NotifyService } from '../../core/notify.service';
import {
  duelLength,
  formatSetting,
  SETTINGS_META,
  type SettingMeta,
} from '../../core/settings-meta';
import { AdStateComponent } from '../../ui/state.component';
import { AutofocusDirective } from '../../ui/autofocus.directive';
import { AdToggleComponent } from '../../ui/toggle.component';
import { messageOf } from '../questions/questions.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';
import { NgTemplateOutlet } from '@angular/common';
import { facelift } from '../../core/facelift-preview';
import { SettingsTodayComponent } from './settings-today.component';
import {
  PART_DIMS,
  LIST_DIMS,
  LIST_PROPOSALS,
  V_DIMS,
  V_PROPOSALS,
  W_DIMS,
  W_PROPOSALS,
  H_DIMS,
  H_PROPOSALS,
  G_DIMS,
  G_PROPOSALS,
  J_DIMS,
  J_PROPOSALS,
  L_DIMS,
  L_PROPOSALS,
  B_DIMS,
  B_PROPOSALS,
  C_DIMS,
  C_PROPOSALS,
  D_DIMS,
  D_PROPOSALS,
  E_DIMS,
  E_PROPOSALS,
  F_DIMS,
  F_PROPOSALS,
  I_DIMS,
  I_PROPOSALS,
  S_DIMS,
  S_PROPOSALS,
  A_DIMS,
  A_PROPOSALS,
  P_DIMS,
  P_PROPOSALS,
  Q_DIMS,
  Q_PROPOSALS,
  X_DIMS,
  X_PROPOSALS,
  Y_PROPOSALS,
  POP_DIMS,
  POP_PROPOSALS,
  PROPOSALS,
  type Parts,
  type PopParts,
} from './settings-parts';
import { sessionStore } from '../../../../core/platform/safe-storage';

const PARTS_KEY = 'playduelio.admin.rule-parts';
const PARTS_FACE_KEY = 'playduelio.admin.rule-parts-face';

function loadParts(): Parts {
  try {
    const stored = sessionStore.get(PARTS_KEY);
    if (stored) {
      return { ...PROPOSALS['q1']!, ...(JSON.parse(stored) as Partial<Parts>) };
    }
  } catch {
    // Falls back to the first proposal.
  }
  return { ...PROPOSALS['q1']! };
}

const POP_KEY = 'playduelio.admin.rule-parts-pop';

function loadPopParts(): PopParts {
  try {
    const stored = sessionStore.get(POP_KEY);
    if (stored) {
      return {
        ...POP_PROPOSALS['t1']!,
        ...(JSON.parse(stored) as Partial<PopParts>),
      };
    }
  } catch {
    // Falls back to the first proposal.
  }
  return { ...POP_PROPOSALS['t1']! };
}

/** What each preset is made for. */
const PURPOSE: Record<string, string> = {
  short: 'Für viel Andrang: kurze Duelle, mehr Spielende pro Stunde.',
  default: 'Ausgewogen für die meisten Einsätze.',
  long: 'Für ruhige Momente: mehr Fragen und mehr Zeit zum Überlegen.',
};

/** Pages that can hold unsaved changes when the admin navigates away. */
export interface UnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** The rules of the game, with what they mean before they are saved. */
@Component({
  selector: 'app-admin-settings',
  imports: [
    AutofocusDirective,
    NgTemplateOutlet,
    SettingsTodayComponent,
    AdPageHeadComponent,
    RouterLink,
    AdStateComponent,
    AdToggleComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrls: [
    './settings.component.scss',
    './settings-drafts.scss',
    './settings-approaches.scss',
    './settings-more.scss',
    './settings-r7.scss',
    './settings-r7b.scss',
    './settings-r8.scss',
    './settings-r8b.scss',
    './settings-r9.scss',
    './settings-r10.scss',
    './settings-r11.scss',
    './settings-r12.scss',
    './settings-r13.scss',
    './settings-r14.scss',
    './settings-r15.scss',
    './settings-r16.scss',
    './settings-r17.scss',
    './settings-r18.scss',
    './settings-r19.scss',
    './settings-r20.scss',
    './settings-r21.scss',
    './settings-r22.scss',
    './settings-r23.scss',
    './settings-r24.scss',
    './settings-r25.scss',
    './settings-r26.scss',
    './settings-r27.scss',
    './settings-r28.scss',
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsComponent implements UnsavedChanges {
  protected readonly data = inject(AdminData);
  private readonly api = inject(AdminApi);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);

  protected readonly meta = SETTINGS_META;
  protected readonly formatSetting = formatSetting;
  protected readonly formatRelative = formatRelative;
  protected readonly emptySet: ReadonlySet<string> = new Set();

  /** Temporary: the facelift draft shown. */
  protected readonly face = computed(() => facelift() ?? 'p1');

  /** The rules in the order of a duel: how it runs, the points, what follows. */
  protected readonly chapters = computed(() => {
    const rows = this.rows();
    const pick = (keys: string[]) => rows.filter((r) => keys.includes(r.meta.key));
    return [
      {
        title: 'Ablauf eines Duells',
        note: 'Wie viele Fragen und wie viel Zeit',
        rows: pick(['questionsPerGame', 'questionDurationSec', 'revealDurationSec']),
      },
      {
        title: 'Punkte',
        note: 'Was eine richtige Antwort bringt',
        rows: pick(['speedBonusEnabled']),
      },
      {
        title: 'Nach dem Duell',
        note: 'Revanche und Neustart der Geräte',
        rows: pick(['rematchTimeoutSec', 'idleResetSec']),
      },
    ];
  });

  /** One duel from the start to the end, as shares of its longest length. */
  protected readonly timeline = computed(() => {
    const draft = this.draft();
    if (!draft) {
      return null;
    }
    const countdown = 3;
    const question = draft.questionDurationSec;
    const reveal = draft.revealDurationSec;
    const total = countdown + draft.questionsPerGame * (question + reveal);
    return {
      countdown: (countdown / total) * 100,
      question: (question / total) * 100,
      reveal: (reveal / total) * 100,
      questions: Array.from({ length: draft.questionsPerGame }, (_, i) => i + 1),
      seconds: total,
    };
  });

  /** Rules open for editing in «Ansehen + Ändern», and with a custom value. */
  protected readonly editingRules = signal<ReadonlySet<string>>(new Set());
  protected readonly customRules = signal<ReadonlySet<string>>(new Set());

  protected toggleIn(store: 'editing' | 'custom', key: string): void {
    const target = store === 'editing' ? this.editingRules : this.customRules;
    target.update((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  /** A value outside the quick values needs the custom field. */
  protected isCustom(row: { meta: SettingMeta; number: number }): boolean {
    const values = this.quickFor(row.meta);
    return (
      this.customRules().has(row.meta.key) ||
      (!!values && !values.includes(row.number))
    );
  }

  /** What each chapter decides, as one figure for its heading. */
  protected readonly chapterEffect = computed(() => {
    const i = this.impact();
    const d = this.draft();
    if (!i || !d) {
      return [];
    }
    return [
      { label: 'Ein Duell dauert', value: i.typical, note: `höchstens ${i.max}` },
      { label: 'Höchstpunktzahl', value: i.maxPoints, note: 'pro Person und Duell' },
      {
        label: 'Neustart',
        value: d.idleResetSec ? `${d.idleResetSec} s` : 'aus',
        note: `Revanche ${d.rematchTimeoutSec} s`,
      },
    ];
  });

  /** Open chapters in «Aufklappbar»; the first is open at the start. */
  protected readonly openChapters = signal<ReadonlySet<number>>(new Set([0]));

  protected toggleChapter(index: number): void {
    this.openChapters.update((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  /** The values of a chapter in one line, for its closed heading. */
  protected summaryOf(
    rows: { meta: SettingMeta; value: number | boolean }[],
  ): string {
    return rows
      .map((r) =>
        r.meta.key === 'questionsPerGame'
          ? `${r.value} Fragen`
          : r.meta.key === 'speedBonusEnabled'
            ? `Tempo-Bonus ${r.value ? 'an' : 'aus'}`
            : `${r.meta.label} ${formatSetting(r.meta.key, r.value)}`,
      )
      .join(' · ');
  }

  /** The standard value of a rule. */
  protected defaultOf(meta: SettingMeta): number | boolean | null {
    return this.defaults()?.[meta.key] ?? null;
  }

  protected readonly atDefault = computed(() => {
    const draft = this.draft();
    const defaults = this.defaults();
    return (
      !!draft &&
      !!defaults &&
      SETTINGS_META.every((meta) => draft[meta.key] === defaults[meta.key])
    );
  });

  protected allToDefault(): void {
    const defaults = this.defaults();
    if (defaults) {
      this.draft.set({ ...defaults });
    }
  }

  /** Runde 7: the saved value of a rule, to undo one change. */
  protected undo(meta: SettingMeta): void {
    const saved = this.saved();
    if (saved) {
      this.draft.update((draft) =>
        draft ? { ...draft, [meta.key]: saved[meta.key] } : draft,
      );
    }
  }

  protected savedText(meta: SettingMeta): string {
    const saved = this.saved();
    return saved ? formatSetting(meta.key, saved[meta.key]) : '';
  }

  /** The rules of a chapter back to their standard values. */
  protected chapterToDefault(rows: { meta: SettingMeta }[]): void {
    const defaults = this.defaults();
    if (defaults) {
      this.draft.update((draft) => {
        if (!draft) {
          return draft;
        }
        const next = { ...draft };
        for (const row of rows) {
          (next as Record<string, unknown>)[row.meta.key] = defaults[row.meta.key];
        }
        return next;
      });
    }
  }

  protected chapterAtDefault(
    rows: { meta: SettingMeta; value: number | boolean }[],
  ): boolean {
    const defaults = this.defaults();
    return !!defaults && rows.every((r) => r.value === defaults[r.meta.key]);
  }

  /** What a value would mean, for the option tiles. */
  protected optionNote(meta: SettingMeta, value: number): string {
    const draft = this.draft();
    if (!draft) {
      return '';
    }
    if (meta.key === 'questionDurationSec') {
      const avg = this.avgAnswerMs();
      if (avg !== null && value * 1000 < avg * 1.4) {
        return 'Zeit läuft oft ab';
      }
      const length = duelLength({ ...draft, [meta.key]: value });
      return `Duell bis ${formatDuration(length.max)}`;
    }
    if (meta.key === 'questionsPerGame' || meta.key === 'revealDurationSec') {
      const length = duelLength(
        { ...draft, [meta.key]: value },
        this.avgAnswerMs() ?? undefined,
      );
      return `Duell ≈ ${formatDuration(length.typical)}`;
    }
    if (meta.key === 'idleResetSec') {
      return value === 0 ? 'Geräte bleiben stehen' : 'nach Ruhe zur Startseite';
    }
    return 'zum Einigen';
  }

  /** «Ansehen, dann ändern»: the rule open and its value before. */
  protected readonly editKey = signal<string | null>(null);
  private editBefore: number | boolean | null = null;

  protected startEdit(meta: SettingMeta): void {
    this.editKey.set(meta.key);
    this.editBefore = this.draft()?.[meta.key] ?? null;
  }

  protected cancelEdit(meta: SettingMeta): void {
    const before = this.editBefore;
    if (before !== null) {
      this.draft.update((draft) =>
        draft ? { ...draft, [meta.key]: before } : draft,
      );
    }
    this.editKey.set(null);
  }

  /** The presets with the rules they set, for the larger cards. */
  protected readonly presetCards = computed(() =>
    this.presets().map((preset) => ({
      ...preset,
      questions: preset.values.questionsPerGame ?? 0,
      seconds: preset.values.questionDurationSec ?? 0,
      reveal: preset.values.revealDurationSec ?? 0,
    })),
  );

  /** Everything at its standard value, after asking. */
  protected async resetAll(): Promise<void> {
    const sure = await this.confirm.ask({
      title: 'Alle Regeln auf Standard?',
      text: 'Alle Werte gehen auf ihren Standard zurück. Gespeichert wird erst mit «Speichern».',
      confirm: 'Auf Standard setzen',
    });
    if (sure) {
      this.allToDefault();
    }
  }

  /** The 4th figure: how long players need to answer. */
  protected readonly answerTime = computed(() => this.impact()?.avgAnswer ?? null);

  /** Runde 8: the last changes of the rules, from the log. */
  protected readonly formatDateTime = formatDateTime;
  protected readonly history = signal<AuditEntry[] | null>(null);

  private async loadHistory(): Promise<void> {
    try {
      const page = await this.api.audit(undefined, 100, false);
      this.history.set(
        page.entries.filter((e) => e.action.startsWith('settings.')).slice(0, 4),
      );
    } catch {
      this.history.set([]);
    }
  }

  protected readonly lastChanges = computed(() =>
    (this.history() ?? []).map((entry) => ({
      id: entry.id,
      at: entry.at,
      restore: entry.action === 'settings.restore',
      changes:
        entry.before && entry.after
          ? SETTINGS_META.filter(
              (meta) => entry.before![meta.key] !== entry.after![meta.key],
            ).map((meta) => ({
              label: meta.label,
              before: formatSetting(meta.key, entry.before![meta.key]),
              after: formatSetting(meta.key, entry.after![meta.key]),
            }))
          : [],
    })),
  );

  protected readonly last = computed(() => this.lastChanges()[0] ?? null);

  /** The last change as a short value for the big figure, the rest below. */
  protected readonly lastBig = computed(() => {
    const last = this.last();
    if (!last) {
      return { value: 'Noch nie', note: 'Es gelten die Standardregeln' };
    }
    const at = new Date(last.at);
    const now = new Date(this.tick());
    const minutes = Math.round((now.getTime() - at.getTime()) / 60000);
    const time = at.toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const day = (d: Date) => d.toDateString();
    const yesterday = new Date(now.getTime() - 86_400_000);
    let value: string;
    let when: string;
    if (minutes < 1) {
      value = 'Gerade eben';
      when = `um ${time}`;
    } else if (minutes < 60) {
      value = `vor ${minutes} Min.`;
      when = `um ${time}`;
    } else if (day(at) === day(now)) {
      value = 'Heute';
      when = `um ${time}`;
    } else if (day(at) === day(yesterday)) {
      value = 'Gestern';
      when = `um ${time}`;
    } else {
      value = at.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' });
      when = `um ${time}`;
    }
    const n = last.changes.length;
    const what = last.restore
      ? 'Wiederhergestellt'
      : n === 1
        ? '1 Regel'
        : `${n} Regeln`;
    return { value, note: `${when} · ${what}` };
  });

  /** The first change of the last save, in one line. */
  protected readonly lastLine = computed(() => {
    const first = this.last()?.changes[0];
    return first ? `${first.label} ${first.before} → ${first.after}` : null;
  });

  /** The open menu or popover of a rule. */
  protected readonly menuKey = signal<string | null>(null);

  protected toggleMenu(key: string): void {
    this.menuKey.update((current) => (current === key ? null : key));
  }

  @HostListener('document:mousedown', ['$event'])
  protected onOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (this.menuKey() && !target?.closest('[data-menu]')) {
      this.menuKey.set(null);
    }
  }

  /** A value of a rule picked from a menu; the menu closes. */
  protected pick(meta: SettingMeta, value: number): void {
    this.setValue(meta, value);
    this.menuKey.set(null);
    this.reviewOpen.set(false);
  }

  /** The rules the comparison of presets lists, with each preset's value. */
  protected readonly presetTable = computed(() => {
    const draft = this.draft();
    const presets = this.presets();
    if (!draft) {
      return [];
    }
    return (
      ['questionsPerGame', 'questionDurationSec', 'revealDurationSec'] as const
    ).map((key) => ({
      label: SETTINGS_META.find((m) => m.key === key)!.label,
      current: formatSetting(key, draft[key]),
      values: presets.map((preset) => ({
        id: preset.id,
        text: formatSetting(key, preset.values[key] ?? draft[key]),
        same: (preset.values[key] ?? draft[key]) === draft[key],
      })),
    }));
  });

  /** Where a value sits on the slider, 0–100. */
  protected at(
    row: { limit: { min: number; max: number } | null },
    value: number,
  ): number {
    return row.limit ? this.share(value, row.limit.min, row.limit.max) : 0;
  }

  /** Runde 9: the blocks of the rules area, set by a proposal or by hand. */
  protected readonly partDims = PART_DIMS;
  protected readonly isKit = computed(() => /^[qr]\d/.test(this.face()));
  protected readonly parts = signal<Parts>(loadParts());

  protected setPart(dim: keyof Parts, id: string): void {
    this.parts.update((parts) => ({ ...parts, [dim]: id }));
    sessionStore.set(PARTS_KEY, JSON.stringify(this.parts()));
  }

  /** Runde 11: the popover page and its blocks. */
  protected readonly popDims = POP_DIMS;
  protected readonly isT = computed(() =>
    /^[tuvwhgjlbcdefisaPQXY]\d/.test(this.face()),
  );
  protected readonly isU = computed(() =>
    /^[uvwhgjlbcdefisaPQXY]\d/.test(this.face()),
  );
  protected readonly isV = computed(() =>
    /^[vwhgjlbcdefisaPQXY]\d/.test(this.face()),
  );
  protected readonly isH = computed(() => /^[hgjlbcdefisaPQXY]\d/.test(this.face()));
  protected readonly isG = computed(() => /^g\d/.test(this.face()));
  protected readonly isJ = computed(() => /^j\d/.test(this.face()));
  protected readonly jDims = J_DIMS;
  protected readonly isL = computed(() => /^l\d/.test(this.face()));
  protected readonly lDims = L_DIMS;
  protected readonly isB = computed(() => /^b\d/.test(this.face()));
  protected readonly bDims = B_DIMS;
  protected readonly isC = computed(() => /^c\d/.test(this.face()));
  protected readonly cDims = C_DIMS;
  protected readonly isD = computed(() => /^[defisaPQXY]\d/.test(this.face()));
  protected readonly dDims = D_DIMS;
  protected readonly isE = computed(() => /^e\d/.test(this.face()));
  protected readonly eDims = E_DIMS;
  protected readonly isF = computed(() => /^f\d/.test(this.face()));
  protected readonly fDims = F_DIMS;
  protected readonly isI = computed(() => /^i\d/.test(this.face()));
  protected readonly iDims = I_DIMS;
  protected readonly isS = computed(() => /^s\d/.test(this.face()));
  protected readonly sDims = S_DIMS;
  protected readonly isA = computed(() => /^[aPQXY]\d/.test(this.face()));
  protected readonly aDims = A_DIMS;
  protected readonly isP = computed(() => /^[PQXY]\d/.test(this.face()));
  protected readonly pDims = P_DIMS;
  protected readonly isQ = computed(() => /^Q\d/.test(this.face()));
  protected readonly qDims = Q_DIMS;
  protected readonly isX = computed(() => /^X\d/.test(this.face()));
  protected readonly xDims = X_DIMS;
  /** The finalists: no draft panel. */
  protected readonly isY = computed(() => /^Y\d/.test(this.face()));

  /** The standard of a rule for the table, «An» rather than «an». */
  protected stdText(row: {
    meta: SettingMeta;
    value: number | boolean;
    defaultText: string | null;
  }): string {
    const text = row.defaultText ?? formatSetting(row.meta.key, row.value);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /** «Alle aufklappen» / «Alle zuklappen» for the rules title. */
  protected readonly allOpen = computed(
    () => this.openChapters().size === this.chapters().length,
  );

  protected toggleAll(): void {
    this.openChapters.set(
      this.allOpen() ? new Set() : new Set(this.chapters().map((_, i) => i)),
    );
  }
  protected readonly hlDev = signal(false);

  /** How many rules of a chapter, or of all, differ from the standard. */
  protected deviating(rows: { defaultText: string | null }[]): number {
    return rows.filter((r) => r.defaultText).length;
  }

  protected readonly deviatingAll = computed(
    () => this.rows().filter((r) => r.defaultText).length,
  );

  /** How far a changed value moved, e.g. «−5 s» or «+3». */
  protected deltaText(row: {
    meta: SettingMeta;
    number: number;
    value: number | boolean;
  }): string {
    const saved = this.saved()?.[row.meta.key];
    if (typeof saved !== 'number' || typeof row.value !== 'number') {
      return row.value ? 'an' : 'aus';
    }
    const diff = row.number - saved;
    const unit = row.meta.unit ? ` ${row.meta.unit}` : '';
    return `${diff > 0 ? '+' : '−'}${Math.abs(diff)}${unit}`;
  }

  /** What one changed rule does on its own, for «Mit Wirkung». */
  protected ruleImpact(row: { meta: SettingMeta; value: number | boolean }): string {
    const draft = this.draft();
    const saved = this.saved();
    if (!draft || !saved) {
      return '';
    }
    const key = row.meta.key;
    const avg = this.avgAnswerMs() ?? undefined;
    if (
      key === 'questionsPerGame' ||
      key === 'questionDurationSec' ||
      key === 'revealDurationSec'
    ) {
      const before = duelLength({ ...draft, [key]: saved[key] }, avg);
      const after = duelLength(draft, avg);
      const pick = key === 'questionDurationSec' ? 'max' : 'typical';
      const word = key === 'questionDurationSec' ? 'höchstens ' : '';
      return `Ein Duell dauert ${word}${formatDuration(after[pick])} statt ${formatDuration(before[pick])}`;
    }
    if (key === 'speedBonusEnabled') {
      const per = (on: boolean) => draft.questionsPerGame * (on ? 200 : 100);
      return `Höchstpunktzahl ${formatInt(per(draft.speedBonusEnabled))} statt ${formatInt(per(saved.speedBonusEnabled))}`;
    }
    if (key === 'rematchTimeoutSec') {
      return `Beide haben ${draft.rematchTimeoutSec} s statt ${saved.rematchTimeoutSec} s für die Revanche`;
    }
    return `Geräte kehren nach ${formatSetting(key, draft[key])} statt ${formatSetting(key, saved[key])} zurück`;
  }

  /** The place of a change in the review list, for «Nummeriert». */
  protected changeNo(key: string): number {
    return this.changes().findIndex((c) => c.key === key) + 1;
  }
  protected readonly peek = signal(false);

  /** When the first unsaved change was made, refreshed twice a minute. */
  protected readonly dirtySince = signal<number | null>(null);
  private readonly tick = signal(Date.now());
  protected readonly sinceText = computed(() => {
    const since = this.dirtySince();
    return since === null ? '' : formatRelative(since, this.tick());
  });

  /** One line for all changes: the first by name, the rest counted. */
  protected readonly smartTitle = computed(() => {
    const changes = this.changes();
    const first = changes[0];
    if (!first) {
      return '';
    }
    if (changes.length === 1) {
      return `${first.label}: ${first.before} → ${first.after}`;
    }
    const rest = changes.length - 1;
    return `${first.label} und ${rest} weitere ${rest === 1 ? 'Änderung' : 'Änderungen'}`;
  });
  protected readonly gDims = G_DIMS;
  protected readonly hDims = H_DIMS;
  protected readonly isW = computed(() => /^w\d/.test(this.face()));
  protected readonly wDims = W_DIMS;
  protected readonly vDims = V_DIMS;
  protected readonly listDims = LIST_DIMS;
  protected readonly sp = signal<PopParts>(loadPopParts());

  protected setPop(dim: keyof PopParts, id: string): void {
    this.sp.update((parts) => ({ ...parts, [dim]: id }));
    if (dim === 'open') {
      this.openChapters.set(
        new Set(id === 'all' ? this.chapters().map((_, i) => i) : [0]),
      );
    }
    sessionStore.set(POP_KEY, JSON.stringify(this.sp()));
  }

  protected readonly saveInHead = computed(
    () =>
      this.dirty() &&
      ((this.isKit() && this.parts().save === 'head') ||
        (this.isT() && this.sp().save === 'head')),
  );

  /** Runde 12: the option under the mouse or the arrow keys. */
  protected readonly listActive = signal(0);
  protected readonly hoverValue = signal<number | null>(null);

  protected onListKey(event: KeyboardEvent, row: { meta: SettingMeta }): void {
    const values = this.quickFor(row.meta) ?? [];
    if (!values.length) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next = (this.listActive() + step + values.length) % values.length;
      this.listActive.set(next);
      this.hoverValue.set(values[next]!);
    } else if (
      event.key === 'Enter' &&
      (event.target as HTMLElement).tagName !== 'INPUT'
    ) {
      event.preventDefault();
      this.pick(row.meta, values[this.listActive()]!);
    }
  }

  /** A duel with one rule at another value, for the bars and the preview. */
  private lengthWith(meta: SettingMeta, value: number): number | null {
    const draft = this.draft();
    if (
      !draft ||
      !['questionsPerGame', 'questionDurationSec', 'revealDurationSec'].includes(
        meta.key,
      )
    ) {
      return null;
    }
    const length = duelLength(
      { ...draft, [meta.key]: value },
      this.avgAnswerMs() ?? undefined,
    );
    return meta.key === 'questionDurationSec' ? length.max : length.typical;
  }

  protected lenShare(meta: SettingMeta, value: number): number | null {
    const values = this.quickFor(meta) ?? [];
    const lengths = values.map((v) => this.lengthWith(meta, v) ?? 0);
    const ms = this.lengthWith(meta, value);
    const top = Math.max(1, ...lengths);
    return ms === null ? null : Math.round((ms / top) * 100);
  }

  /** «Mit Vorschau»: what the hovered value would mean, against now. */
  protected previewOf(row: { meta: SettingMeta; number: number }) {
    const value = this.hoverValue() ?? row.number;
    const ms = this.lengthWith(row.meta, value);
    const now = this.lengthWith(row.meta, row.number);
    const label =
      row.meta.key === 'questionDurationSec'
        ? 'Ein Duell dauert höchstens'
        : 'Ein Duell dauert';
    if (ms === null || now === null) {
      return {
        value,
        label: '',
        length: this.optionNote(row.meta, value),
        delta: null,
      };
    }
    const diff = Math.round((ms - now) / 1000);
    return {
      value,
      label,
      length: formatDuration(ms),
      delta: diff === 0 ? null : `${diff > 0 ? '+' : '−'}${Math.abs(diff)} s`,
    };
  }

  /** Runde 13: the own value field opened, and discarding with a way back. */
  protected readonly ownOpen = signal(false);
  protected readonly discarded = signal<AdminSettings | null>(null);
  private discardTimer: ReturnType<typeof setTimeout> | null = null;

  protected discardSoft(): void {
    const draft = this.draft();
    this.discard();
    this.barOpen.set(false);
    this.discarded.set(draft ? { ...draft } : null);
    if (this.discardTimer) {
      clearTimeout(this.discardTimer);
    }
    this.discardTimer = setTimeout(() => this.discarded.set(null), 6000);
  }

  protected restoreDiscarded(): void {
    const draft = this.discarded();
    if (draft) {
      this.draft.set(draft);
    }
    this.discarded.set(null);
  }

  /** The own value of the list, taken over with Enter or the button. */
  protected takeOwn(row: { invalid: boolean }): void {
    if (!row.invalid) {
      this.ownOpen.set(false);
      this.menuKey.set(null);
    }
  }

  /** The floating bar: open list, a short «Gespeichert» after saving. */
  protected readonly barOpen = signal(false);
  protected readonly justSaved = signal(false);

  protected isSaved(meta: SettingMeta, value: number): boolean {
    return this.saved()?.[meta.key] === value;
  }

  protected undoKey(key: string): void {
    const meta = SETTINGS_META.find((m) => m.key === key);
    if (meta) {
      this.undo(meta);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onSaveKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = !!target?.closest('input, textarea, [contenteditable]');
    if (
      event.key.toLowerCase() === 'p' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !typing &&
      this.dirty() &&
      this.sp().review === 'kbd'
    ) {
      event.preventDefault();
      this.barOpen.update((open) => !open);
      return;
    }
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key.toLowerCase() === 's' &&
      this.dirty()
    ) {
      event.preventDefault();
      void this.save();
    }
  }

  /** The value before the popover opened, for «Abbrechen». */
  private popBefore: number | boolean | null = null;

  protected openPop(meta: SettingMeta): void {
    if (this.menuKey() === meta.key) {
      this.menuKey.set(null);
      return;
    }
    this.popBefore = this.draft()?.[meta.key] ?? null;
    const values = this.quickFor(meta) ?? [];
    const current = this.draft()?.[meta.key];
    this.listActive.set(Math.max(0, values.indexOf(current as number)));
    this.hoverValue.set(null);
    this.ownOpen.set(false);
    this.menuKey.set(meta.key);
  }

  protected cancelPop(meta: SettingMeta): void {
    const before = this.popBefore;
    if (before !== null) {
      this.draft.update((draft) =>
        draft ? { ...draft, [meta.key]: before } : draft,
      );
    }
    this.menuKey.set(null);
  }

  /** How long a duel is with the saved rules and with the draft. */
  protected readonly lengthNow = computed(() => {
    const draft = this.draft();
    const saved = this.saved();
    if (!draft || !saved) {
      return null;
    }
    const avg = this.avgAnswerMs() ?? undefined;
    return {
      before: formatDuration(duelLength(saved, avg).typical),
      after: formatDuration(duelLength(draft, avg).typical),
    };
  });

  /** Draft only: shows the page with two changes, to see the save area. */
  protected simulateChanges(on: boolean): void {
    if (!on) {
      this.discard();
      return;
    }
    const saved = this.saved();
    if (saved) {
      this.draft.set({
        ...saved,
        questionsPerGame: saved.questionsPerGame === 10 ? 7 : 10,
        questionDurationSec: saved.questionDurationSec === 15 ? 20 : 15,
      });
    }
  }

  /** The longest preset, for the bars of «Karten mit Dauer». */
  protected readonly presetMaxMs = computed(() =>
    Math.max(
      1,
      ...this.presets().map(
        (p) =>
          duelLength(
            { ...(this.draft() ?? this.defaults()!), ...p.values },
            this.avgAnswerMs() ?? undefined,
          ).typical,
      ),
    ),
  );

  protected presetShare(values: Partial<AdminSettings>): number {
    const base = this.draft() ?? this.defaults();
    if (!base) {
      return 0;
    }
    const ms = duelLength(
      { ...base, ...values },
      this.avgAnswerMs() ?? undefined,
    ).typical;
    return Math.round((ms / this.presetMaxMs()) * 100);
  }

  /** The chapter of «Mit Navigation» in view. */
  protected scrollTo(index: number): void {
    document
      .getElementById(`chapter-${index}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** «Prüfen-Dialog»: the changes once more before they are saved. */
  protected readonly reviewOpen = signal(false);

  protected async saveReviewed(): Promise<void> {
    await this.save();
    if (!this.dirty()) {
      this.reviewOpen.set(false);
    }
  }

  /** What a rule means right now, for «Mit Wirkung». */
  protected effectNow(row: {
    meta: SettingMeta;
    value: number | boolean;
    number: number;
  }): string {
    if (row.meta.key === 'speedBonusEnabled') {
      return row.value
        ? 'Bis 200 Punkte pro Frage'
        : '100 Punkte pro richtige Antwort';
    }
    if (row.meta.key === 'rematchTimeoutSec') {
      return `Beide haben ${row.number} s, um sich zu einigen`;
    }
    const note = this.optionNote(row.meta, row.number);
    return note.charAt(0).toUpperCase() + note.slice(1);
  }

  /** The rule edited in the drawer of «Übersicht + Fenster». */
  protected readonly drawerKey = signal<string | null>(null);
  protected readonly drawerRow = computed(
    () => this.rows().find((r) => r.meta.key === this.drawerKey()) ?? null,
  );

  /** The rule whose description is open in «Gruppierte Liste». */
  protected readonly infoOpen = signal<string | null>(null);

  /** The chapter shown in «Reiter». */
  protected readonly tab = signal(0);

  /** How many rules of a chapter differ from what is saved. */
  protected changedIn(rows: { changed: boolean }[]): number {
    return rows.filter((r) => r.changed).length;
  }

  protected row(key: string) {
    return this.rows().find((r) => r.meta.key === key) ?? null;
  }

  /** The rule open in the detail of «Liste + Detail». */
  protected readonly picked = signal<string>('questionsPerGame');
  protected readonly pickedRow = computed(
    () =>
      this.rows().find((r) => r.meta.key === this.picked()) ??
      this.rows()[0] ??
      null,
  );

  /** What one rule means right now, in a sentence. */
  protected effectOf(key: string): string {
    const d = this.draft();
    const i = this.impact();
    if (!d || !i) {
      return '';
    }
    switch (key) {
      case 'questionsPerGame':
        return `Mit ${i.active} aktiven Fragen reicht das für ${i.duelsWithoutRepeat} Duelle ohne Wiederholung.`;
      case 'questionDurationSec':
      case 'revealDurationSec':
        return `Ein Duell dauert damit typisch ${i.typical}, höchstens ${i.max}`.replace(
          /\.?$/,
          '.',
        );
      case 'speedBonusEnabled':
        return `Höchstens ${i.maxPoints} Punkte pro Person und Duell.`;
      case 'rematchTimeoutSec':
        return `Nach dem Duell bleiben ${d.rematchTimeoutSec} s, um eine Revanche zu starten.`;
      default:
        return d.idleResetSec
          ? `Ein Gerät ohne Bedienung startet nach ${d.idleResetSec} s neu.`
          : 'Geräte starten nie von selbst neu.';
    }
  }

  /** Ready sets of rules for the timing of a duel. */
  protected readonly presets = computed(() => {
    const defaults = this.defaults();
    if (!defaults) {
      return [];
    }
    const list: { id: string; label: string; values: Partial<AdminSettings> }[] = [
      {
        id: 'short',
        label: 'Kurz',
        values: {
          questionsPerGame: 5,
          questionDurationSec: 15,
          revealDurationSec: 3,
        },
      },
      {
        id: 'default',
        label: 'Standard',
        values: {
          questionsPerGame: defaults.questionsPerGame,
          questionDurationSec: defaults.questionDurationSec,
          revealDurationSec: defaults.revealDurationSec,
        },
      },
      {
        id: 'long',
        label: 'Ausführlich',
        values: {
          questionsPerGame: 10,
          questionDurationSec: 25,
          revealDurationSec: 5,
        },
      },
    ];
    return list.map((preset) => {
      const settings = { ...(this.draft() ?? defaults), ...preset.values };
      const typical = duelLength(settings, this.avgAnswerMs() ?? undefined).typical;
      const draft = this.draft();
      return {
        ...preset,
        purpose: PURPOSE[preset.id] ?? '',
        perHour: Math.floor(3_600_000 / typical),
        differs: draft
          ? Object.entries(preset.values).filter(
              ([key, value]) => draft[key as keyof AdminSettings] !== value,
            ).length
          : 0,
        note: `${settings.questionsPerGame} Fragen · ${settings.questionDurationSec} s`,
        length: formatDuration(
          duelLength(settings, this.avgAnswerMs() ?? undefined).typical,
        ),
      };
    });
  });

  protected readonly activePreset = computed(() => {
    const draft = this.draft();
    return (
      this.presets().find(
        (preset) =>
          draft &&
          Object.entries(preset.values).every(
            ([key, value]) => draft[key as keyof AdminSettings] === value,
          ),
      )?.id ?? null
    );
  });

  protected readonly activePresetLabel = computed(
    () => this.presets().find((p) => p.id === this.activePreset())?.label ?? '',
  );

  protected applyPreset(values: Partial<AdminSettings>): void {
    this.draft.update((draft) => (draft ? { ...draft, ...values } : draft));
  }

  /** Quick values beside the stepper. */
  protected readonly quickValues: Partial<Record<keyof AdminSettings, number[]>> = {
    questionsPerGame: [5, 7, 10, 15],
    questionDurationSec: [10, 15, 20, 30],
    revealDurationSec: [3, 4, 6, 8],
    rematchTimeoutSec: [30, 45, 60, 90],
    idleResetSec: [0, 60, 120, 300],
  };

  protected quickFor(meta: SettingMeta): number[] | null {
    return this.quickValues[meta.key] ?? null;
  }

  protected setValue(meta: SettingMeta, value: number): void {
    this.update(meta.key as NumericSettingKey, value);
  }

  /** The figures before and after the change, for the comparison. */
  protected readonly compare = computed(() => {
    const draft = this.draft();
    const saved = this.saved();
    if (!draft || !saved) {
      return null;
    }
    const avg = this.avgAnswerMs() ?? undefined;
    const active = (this.data.questions.value() ?? []).filter(
      (q) => q.active,
    ).length;
    const of = (s: AdminSettings) => ({
      length: duelLength(s, avg).typical,
      points: s.questionsPerGame * (s.speedBonusEnabled ? 200 : 100),
      duels: s.questionsPerGame ? Math.floor(active / s.questionsPerGame) : 0,
    });
    const before = of(saved);
    const after = of(draft);
    const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '±');
    return [
      {
        label: 'Ein Duell dauert',
        before: formatDuration(before.length),
        after: formatDuration(after.length),
        delta:
          after.length === before.length
            ? null
            : `${sign(after.length - before.length)}${Math.round(Math.abs(after.length - before.length) / 1000)} s`,
      },
      {
        label: 'Höchstpunktzahl',
        before: formatInt(before.points),
        after: formatInt(after.points),
        delta:
          after.points === before.points
            ? null
            : `${sign(after.points - before.points)}${formatInt(Math.abs(after.points - before.points))}`,
      },
      {
        label: 'Ohne Wiederholung',
        before: `${before.duels} Duelle`,
        after: `${after.duels} Duelle`,
        delta:
          after.duels === before.duels
            ? null
            : `${sign(after.duels - before.duels)}${Math.abs(after.duels - before.duels)}`,
      },
    ];
  });

  /** Runde 15: the three figures with direction, words and bar shares. */
  protected readonly figures = computed(() => {
    const draft = this.draft();
    const saved = this.saved();
    if (!draft || !saved) {
      return [];
    }
    const avg = this.avgAnswerMs() ?? undefined;
    const active = (this.data.questions.value() ?? []).filter(
      (q) => q.active,
    ).length;
    const of = (s: AdminSettings) => [
      duelLength(s, avg).typical,
      s.questionsPerGame * (s.speedBonusEnabled ? 200 : 100),
      s.questionsPerGame ? Math.floor(active / s.questionsPerGame) : 0,
    ];
    const before = of(saved);
    const after = of(draft);
    const labels = ['Ein Duell dauert', 'Höchstpunktzahl', 'Ohne Wiederholung'];
    const show = [
      (n: number) => formatDuration(n),
      (n: number) => formatInt(n),
      (n: number) => `${n} Duelle`,
    ];
    const words = [
      (d: number) =>
        `${Math.round(Math.abs(d) / 1000)} s ${d < 0 ? 'kürzer' : 'länger'}`,
      (d: number) => `${formatInt(Math.abs(d))} ${d < 0 ? 'weniger' : 'mehr'}`,
      (d: number) => `${Math.abs(d)} ${d < 0 ? 'weniger' : 'mehr'}`,
    ];
    return labels.map((label, i) => {
      const b = before[i]!;
      const a = after[i]!;
      const top = Math.max(1, a, b);
      return {
        label,
        before: show[i]!(b),
        after: show[i]!(a),
        changed: a !== b,
        up: a > b,
        words: a === b ? 'unverändert' : words[i]!(a - b),
        shareBefore: Math.round((b / top) * 100),
        shareAfter: Math.round((a / top) * 100),
      };
    });
  });

  private readonly avgAnswerMs = computed(() => {
    const questions = this.data.questions.value() ?? [];
    const answered = questions.reduce((sum, q) => sum + q.stats.answers, 0);
    const ms = questions.reduce(
      (sum, q) => sum + (q.stats.avgAnswerMs ?? 0) * q.stats.answers,
      0,
    );
    return answered > 0 ? ms / answered : null;
  });

  /** Where a value stands between its limits, for the sliders. */
  protected share(value: number, min: number, max: number): number {
    return max > min ? ((value - min) / (max - min)) * 100 : 0;
  }

  protected readonly draft = signal<AdminSettings | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Take over the saved rules when they arrive, unless the admin is editing.
    effect(() => {
      const view = this.data.settings.value();
      if (view && untracked(() => !this.dirty())) {
        this.draft.set({ ...view.settings });
      }
    });
    void this.loadHistory();
    effect(() => {
      const dirty = this.dirty();
      untracked(() => {
        if (!dirty) {
          this.dirtySince.set(null);
        } else if (this.dirtySince() === null) {
          this.dirtySince.set(Date.now());
        }
      });
    });
    const timer = setInterval(() => this.tick.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    // A proposal picked in the switcher sets all blocks at once.
    effect(() => {
      const face = this.face();
      const pop =
        POP_PROPOSALS[face] ??
        LIST_PROPOSALS[face] ??
        V_PROPOSALS[face] ??
        W_PROPOSALS[face] ??
        H_PROPOSALS[face] ??
        G_PROPOSALS[face] ??
        J_PROPOSALS[face] ??
        L_PROPOSALS[face] ??
        B_PROPOSALS[face] ??
        C_PROPOSALS[face] ??
        D_PROPOSALS[face] ??
        E_PROPOSALS[face] ??
        F_PROPOSALS[face] ??
        I_PROPOSALS[face] ??
        S_PROPOSALS[face] ??
        A_PROPOSALS[face] ??
        P_PROPOSALS[face] ??
        Q_PROPOSALS[face] ??
        X_PROPOSALS[face] ??
        Y_PROPOSALS[face];
      if (pop && sessionStore.get(PARTS_FACE_KEY) !== face) {
        sessionStore.set(PARTS_FACE_KEY, face);
        untracked(() => {
          this.sp.set({ ...pop });
          if (pop.open) {
            this.openChapters.set(new Set(pop.open === 'all' ? [0, 1, 2] : [0]));
          }
          sessionStore.set(POP_KEY, JSON.stringify(pop));
        });
      }
      const proposal = PROPOSALS[face];
      if (proposal && sessionStore.get(PARTS_FACE_KEY) !== face) {
        sessionStore.set(PARTS_FACE_KEY, face);
        untracked(() => {
          this.parts.set({ ...proposal });
          sessionStore.set(PARTS_KEY, JSON.stringify(proposal));
        });
      }
    });
  }

  hasUnsavedChanges(): boolean {
    return this.dirty();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.drawerKey.set(null);
    this.menuKey.set(null);
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
    }
  }

  protected readonly saved = computed(
    () => this.data.settings.value()?.settings ?? null,
  );
  protected readonly limits = computed(
    () => this.data.settings.value()?.limits ?? null,
  );
  protected readonly defaults = computed(
    () => this.data.settings.value()?.defaults ?? null,
  );

  protected readonly changes = computed(() => {
    const draft = this.draft();
    const saved = this.saved();
    if (!draft || !saved) {
      return [];
    }
    return SETTINGS_META.filter((meta) => draft[meta.key] !== saved[meta.key]).map(
      (meta) => ({
        key: meta.key,
        label: meta.label,
        before: formatSetting(meta.key, saved[meta.key]),
        after: formatSetting(meta.key, draft[meta.key]),
      }),
    );
  });

  protected readonly dirty = computed(() => this.changes().length > 0);

  protected readonly invalid = computed(() => {
    const draft = this.draft();
    const limits = this.limits();
    if (!draft || !limits) {
      return new Set<NumericSettingKey>();
    }
    return new Set(
      (Object.keys(limits) as NumericSettingKey[]).filter((key) => {
        const value = draft[key];
        return (
          !Number.isInteger(value) ||
          value < limits[key].min ||
          value > limits[key].max
        );
      }),
    );
  });

  /** One row per rule with everything the template shows. */
  protected readonly rows = computed(() => {
    const draft = this.draft();
    const saved = this.saved();
    const limits = this.limits();
    const defaults = this.defaults();
    if (!draft || !limits) {
      return [];
    }
    const invalid = this.invalid();
    return SETTINGS_META.map((meta) => {
      const value = draft[meta.key];
      const limit = meta.key === 'speedBonusEnabled' ? null : limits[meta.key];
      return {
        meta,
        value,
        number: typeof value === 'number' ? value : 0,
        limit,
        changed: saved !== null && value !== saved[meta.key],
        invalid: meta.key !== 'speedBonusEnabled' && invalid.has(meta.key),
        defaultText:
          defaults && value !== defaults[meta.key]
            ? formatSetting(meta.key, defaults[meta.key])
            : null,
        rangeText: limit
          ? `${limit.min}–${limit.max}${meta.unit ? ` ${meta.unit}` : ''}${meta.zero ? `, 0 = ${meta.zero}` : ''}`
          : '',
      };
    });
  });

  /** What the rules mean for players, with the measured answer time. */
  protected readonly impact = computed(() => {
    const draft = this.draft();
    if (!draft) {
      return null;
    }
    const questions = this.data.questions.value() ?? [];
    const active = questions.filter((q) => q.active).length;
    const answered = questions.reduce((sum, q) => sum + q.stats.answers, 0);
    const answerMs = questions.reduce(
      (sum, q) => sum + (q.stats.avgAnswerMs ?? 0) * q.stats.answers,
      0,
    );
    const avgAnswerMs = answered > 0 ? answerMs / answered : null;
    const length = duelLength(draft, avgAnswerMs ?? undefined);
    const maxPoints = draft.questionsPerGame * (draft.speedBonusEnabled ? 200 : 100);
    const warnings: string[] = [];
    if (active < draft.questionsPerGame) {
      warnings.push(
        `Nur ${formatInt(active)} aktive Fragen – mit ${draft.questionsPerGame} Fragen pro Duell kann niemand spielen.`,
      );
    }
    if (
      avgAnswerMs !== null &&
      draft.questionDurationSec * 1000 < avgAnswerMs * 1.4
    ) {
      warnings.push(
        `Im Schnitt brauchen Spielende ${formatSeconds(avgAnswerMs)} pro Antwort. Mit ${draft.questionDurationSec} s läuft die Zeit oft ab.`,
      );
    }
    return {
      typical: formatDuration(length.typical),
      max: formatDuration(length.max),
      maxPoints: formatInt(maxPoints),
      active: formatInt(active),
      duelsWithoutRepeat: draft.questionsPerGame
        ? Math.max(0, Math.floor(active / draft.questionsPerGame))
        : 0,
      avgAnswer: avgAnswerMs === null ? null : formatSeconds(avgAnswerMs),
      warnings,
    };
  });

  protected setNumber(meta: SettingMeta, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.update(
      meta.key as NumericSettingKey,
      Number.isFinite(value) ? Math.round(value) : 0,
    );
  }

  protected step(meta: SettingMeta, direction: 1 | -1): void {
    const key = meta.key as NumericSettingKey;
    const draft = this.draft();
    const limits = this.limits();
    if (!draft || !limits) {
      return;
    }
    const step = meta.step ?? 1;
    const next = Math.round((draft[key] + direction * step) / step) * step;
    this.update(key, Math.min(limits[key].max, Math.max(limits[key].min, next)));
  }

  protected setBonus(value: boolean): void {
    this.draft.update((draft) =>
      draft ? { ...draft, speedBonusEnabled: value } : draft,
    );
  }

  protected toDefault(meta: SettingMeta): void {
    const defaults = this.defaults();
    if (defaults) {
      this.draft.update((draft) =>
        draft ? { ...draft, [meta.key]: defaults[meta.key] } : draft,
      );
    }
  }

  private update(key: NumericSettingKey, value: number): void {
    this.draft.update((draft) => (draft ? { ...draft, [key]: value } : draft));
    this.error.set(null);
  }

  protected discard(): void {
    const saved = this.saved();
    if (saved) {
      this.draft.set({ ...saved });
    }
  }

  protected async save(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving() || this.invalid().size > 0) {
      return;
    }
    const active = (this.data.questions.value() ?? []).filter(
      (q) => q.active,
    ).length;
    if (active < draft.questionsPerGame && this.data.questions.value()) {
      const sure = await this.confirm.ask({
        title: 'Trotzdem speichern?',
        text: `Es gibt nur ${formatInt(active)} aktive Fragen. Mit ${draft.questionsPerGame} Fragen pro Duell kann niemand mehr spielen, bis es genug Fragen gibt.`,
        confirm: 'Speichern',
        danger: true,
      });
      if (!sure) {
        return;
      }
    }
    this.saving.set(true);
    try {
      const view = await this.api.updateSettings(draft);
      this.data.settings.set(view);
      this.draft.set({ ...view.settings });
      void this.data.hints.reload();
      void this.loadHistory();
      this.notify.success('Spielregeln gespeichert – gelten ab dem nächsten Duell');
      this.barOpen.set(false);
      this.justSaved.set(true);
      setTimeout(() => this.justSaved.set(false), 2600);
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }
}
