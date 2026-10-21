// TEMPORARY: proposal O «Insights» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { RulesDrawerComponent } from '../board/rules-drawer.component';
import { ProposalPro } from '../pro';
import { ProposalStore, successRate } from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';
import { WorkspaceNav } from '../workspace/workspace-nav';
import { WsQuestionsComponent } from '../workspace/ws-questions.component';

/** Answered this often before a rate is meaningful. */
const MIN_ASKED = 5;

/** What the table below the charts shows. */
type Focus =
  | { kind: 'bucket'; from: number }
  | { kind: 'category'; name: string }
  | { kind: 'zone'; zone: 'hard' | 'easy' }
  | { kind: 'question'; id: number }
  | null;

interface Tip {
  x: number;
  y: number;
  value: string;
  label: string;
}

// Chart geometry in the units of the SVG view boxes.
const W = 600;
const H = 240;
const PAD = { top: 16, right: 12, bottom: 32, left: 40 };

/**
 * The admin reads the data: how hard the questions are, how the categories
 * compare and which questions stand out. Every chart is a way into the
 * questions – a click shows them in the table below, ready to act on.
 */
@Component({
  selector: 'app-insights',
  imports: [
    LogoMarkComponent,
    ProposalDialogsComponent,
    RulesDrawerComponent,
    WsQuestionsComponent,
  ],
  providers: [WorkspaceNav],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InsightsComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly W = W;
  protected readonly H = H;
  protected readonly PAD = PAD;
  protected readonly rate = successRate;
  protected readonly view = signal<'insights' | 'questions'>('insights');
  protected readonly rulesOpen = signal(false);
  protected readonly category = signal<string | null>(null);
  protected readonly activeOnly = signal(true);
  protected readonly focus = signal<Focus>(null);
  protected readonly tip = signal<(Tip & { chart: string }) | null>(null);

  /** The questions the filters above the charts let through. */
  protected readonly scope = computed(() =>
    (this.store.questions() ?? []).filter(
      (q) =>
        (!this.activeOnly() || q.active) &&
        (this.category() === null || (q.category ?? '') === this.category()),
    ),
  );
  private readonly rated = computed(() =>
    this.scope().filter((q) => q.timesAsked >= MIN_ASKED),
  );

  protected readonly hero = computed(() => {
    const scope = this.scope();
    const asked = scope.reduce((s, q) => s + q.timesAsked, 0);
    const correct = scope.reduce((s, q) => s + q.timesCorrect, 0);
    return { rate: asked ? Math.round((correct / asked) * 100) : null, asked };
  });

  // -- Histogram: how many questions in each band of 10 % ------------------
  protected readonly histogram = computed(() => {
    const counts = Array.from({ length: 10 }, () => 0);
    for (const q of this.rated()) {
      counts[Math.min(9, Math.floor((successRate(q) ?? 0) / 10))]!++;
    }
    // A round top for the scale, so the highest bar meets a grid line.
    const step = Math.max(1, Math.ceil(Math.max(1, ...counts) / 4));
    const max = step * Math.ceil(Math.max(1, ...counts) / step);
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const slot = plotW / 10;
    const bar = Math.min(24, slot - 4);
    return {
      max,
      ticks: this.ticks(max),
      bars: counts.map((count, i) => {
        const h = (count / max) * plotH;
        const x = PAD.left + i * slot + (slot - bar) / 2;
        return {
          from: i * 10,
          count,
          x,
          w: bar,
          y: PAD.top + plotH - h,
          h,
          cx: x + bar / 2,
        };
      }),
    };
  });

  // -- Categories: average rate, horizontal bars ---------------------------
  protected readonly categories = computed(() =>
    this.store
      .categoryStats()
      .map((c) => {
        const list = (this.store.questions() ?? []).filter(
          (q) => (q.category ?? '') === c.name && (!this.activeOnly() || q.active),
        );
        const asked = list.reduce((s, q) => s + q.timesAsked, 0);
        const correct = list.reduce((s, q) => s + q.timesCorrect, 0);
        return {
          name: c.name,
          count: list.length,
          rate: asked ? Math.round((correct / asked) * 100) : null,
        };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => (a.rate ?? -1) - (b.rate ?? -1)),
  );

  // -- Scatter: asked × correct --------------------------------------------
  protected readonly scatter = computed(() => {
    const list = this.scope().filter((q) => q.timesAsked > 0);
    const maxX = Math.max(5, ...list.map((q) => q.timesAsked));
    const niceX = Math.ceil(maxX / 5) * 5;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const x = (v: number) => PAD.left + (v / niceX) * plotW;
    const y = (v: number) => PAD.top + plotH - (v / 100) * plotH;
    return {
      xTicks: Array.from({ length: 6 }, (_, i) => (niceX / 5) * i).map((v) => ({
        v,
        x: x(v),
      })),
      yTicks: [0, 25, 50, 75, 100].map((v) => ({ v, y: y(v) })),
      hardY: y(20),
      easyY: y(90),
      bottom: y(0),
      top: y(100),
      dots: list.map((q) => ({ q, x: x(q.timesAsked), y: y(successRate(q) ?? 0) })),
    };
  });

  protected readonly recommendations = computed(() => {
    const items: { text: string; action: string; focus: Focus }[] = [];
    const hard = this.rated().filter((q) => (successRate(q) ?? 0) < 20);
    if (hard.length) {
      items.push({
        text: `${hard.length} ${hard.length === 1 ? 'Frage wird' : 'Fragen werden'} fast immer falsch beantwortet. Prüfe, ob die richtige Antwort stimmt.`,
        action: 'Fragen ansehen',
        focus: { kind: 'zone', zone: 'hard' },
      });
    }
    const easy = this.rated().filter((q) => (successRate(q) ?? 0) > 90);
    if (easy.length) {
      items.push({
        text: `${easy.length} ${easy.length === 1 ? 'Frage ist' : 'Fragen sind'} sehr leicht und entscheiden kaum ein Duell.`,
        action: 'Fragen ansehen',
        focus: { kind: 'zone', zone: 'easy' },
      });
    }
    const rated = this.categories().filter((c) => c.rate !== null);
    if (rated.length > 1) {
      const lowest = rated[0]!;
      items.push({
        text: `«${lowest.name || 'Ohne Kategorie'}» ist am schwersten (${lowest.rate} % richtig).`,
        action: 'Kategorie ansehen',
        focus: { kind: 'category', name: lowest.name },
      });
    }
    const perGame = this.store.settings()?.questionsPerGame ?? 0;
    const active = this.store.counts().active;
    if (perGame && active < perGame * 5) {
      items.push({
        text: `Mit ${active} aktiven Fragen und ${perGame} pro Duell wiederholen sich Fragen schnell. Mehr Fragen bringen Abwechslung.`,
        action: 'Fragen hinzufügen',
        focus: null,
      });
    }
    return items;
  });

  /** The questions for the table, from the focus or else the scope. */
  protected readonly focused = computed<AdminQuestion[]>(() => {
    const focus = this.focus();
    const scope = this.scope();
    if (!focus) {
      return [...this.rated()]
        .sort((a, b) => (successRate(a) ?? 0) - (successRate(b) ?? 0))
        .slice(0, 8);
    }
    switch (focus.kind) {
      case 'bucket':
        return this.rated().filter(
          (q) =>
            Math.min(9, Math.floor((successRate(q) ?? 0) / 10)) * 10 === focus.from,
        );
      case 'category':
        return (this.store.questions() ?? []).filter(
          (q) =>
            (q.category ?? '') === focus.name && (!this.activeOnly() || q.active),
        );
      case 'zone':
        return this.rated().filter((q) =>
          focus.zone === 'hard'
            ? (successRate(q) ?? 0) < 20
            : (successRate(q) ?? 0) > 90,
        );
      case 'question':
        return scope.filter((q) => q.id === focus.id);
    }
  });
  protected readonly focusLabel = computed(() => {
    const focus = this.focus();
    if (!focus) {
      return 'Die schwierigsten Fragen';
    }
    switch (focus.kind) {
      case 'bucket':
        return `${focus.from}–${focus.from + 9} % richtig`;
      case 'category':
        return `Kategorie «${focus.name || 'Ohne Kategorie'}»`;
      case 'zone':
        return focus.zone === 'hard'
          ? 'Zu schwer (unter 20 % richtig)'
          : 'Zu leicht (über 90 % richtig)';
      case 'question':
        return 'Ausgewählte Frage';
    }
  });

  protected show(tip: Tip, chart: string, event: Event): void {
    const card = (event.target as Element).closest('.chart');
    const svg = card?.querySelector('svg');
    if (!card || !svg) {
      return;
    }
    // From view box units to pixels in the card.
    const box = svg.getBoundingClientRect();
    const base = card.getBoundingClientRect();
    const scale = box.width / W;
    this.tip.set({
      ...tip,
      chart,
      x: box.left - base.left + tip.x * scale,
      y: box.top - base.top + tip.y * scale,
    });
  }

  protected hide(): void {
    this.tip.set(null);
  }

  protected act(focus: Focus): void {
    if (focus) {
      this.focus.set(focus);
      document
        .getElementById('insights-table')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      this.store.openEditor(null);
    }
  }

  private ticks(max: number): { v: number; y: number }[] {
    const plotH = H - PAD.top - PAD.bottom;
    const step = Math.max(1, Math.ceil(max / 4));
    return Array.from(
      { length: Math.floor(max / step) + 1 },
      (_, i) => i * step,
    ).map((v) => ({
      v,
      y: PAD.top + plotH - (v / max) * plotH,
    }));
  }
}
