// TEMPORARY: proposal H «Review» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  output,
  signal,
  untracked,
} from '@angular/core';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { RulesDrawerComponent } from '../board/rules-drawer.component';
import { ProposalStore, successRate } from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';

type Filter = 'all' | 'hard' | 'new' | 'paused';
type Verdict = 'keep' | 'pause';

/** How far a card must be dragged to count as a decision. */
const SWIPE_PX = 110;

/**
 * Questions one at a time, as cards in the look of the game: swipe right
 * (or →) to keep a question in the game, left (or ←) to pause it, E to edit.
 * Made for going through the questions quickly, also on the phone.
 */
@Component({
  selector: 'app-review',
  imports: [LogoMarkComponent, RulesDrawerComponent, ProposalDialogsComponent],
  templateUrl: './review.component.html',
  styleUrl: './review.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '(document:keydown)': 'onKey($event)' },
})
export class ReviewComponent {
  protected readonly store = inject(ProposalStore);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly Math = Math;
  protected readonly rate = successRate;
  protected readonly rulesOpen = signal(false);
  protected readonly filter = signal<Filter>('all');
  protected readonly filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'hard', label: 'Schwierige' },
    { value: 'new', label: 'Nie gestellt' },
    { value: 'paused', label: 'Pausierte' },
  ];

  /** The cards of this round, fixed when it starts. */
  protected readonly deck = signal<number[]>([]);
  protected readonly position = signal(0);
  protected readonly verdicts = signal<Verdict[]>([]);
  /** The drag of the top card. */
  protected readonly dx = signal(0);
  protected readonly dragging = signal(false);
  protected readonly leaving = signal<Verdict | null>(null);

  private readonly loaded = computed(() => this.store.questions() !== null);
  private readonly byId = computed(
    () => new Map((this.store.questions() ?? []).map((q) => [q.id, q])),
  );
  protected readonly cards = computed(() =>
    this.deck()
      .slice(this.position(), this.position() + 3)
      .map((id) => this.byId().get(id))
      .filter((q): q is AdminQuestion => !!q),
  );
  protected readonly kept = computed(
    () => this.verdicts().filter((v) => v === 'keep').length,
  );
  protected readonly paused = computed(
    () => this.verdicts().filter((v) => v === 'pause').length,
  );
  protected readonly hint = computed<Verdict | null>(() =>
    this.dx() > 40 ? 'keep' : this.dx() < -40 ? 'pause' : null,
  );

  constructor() {
    // A new round when the filter changes or the questions first arrive.
    effect(() => {
      const filter = this.filter();
      if (this.loaded()) {
        untracked(() => this.start(filter));
      }
    });
  }

  protected start(filter: Filter = this.filter()): void {
    const all = this.store.questions() ?? [];
    const pick = all.filter((q) => {
      const r = successRate(q);
      return filter === 'hard'
        ? r !== null && r < 25
        : filter === 'new'
          ? q.timesAsked === 0
          : filter === 'paused'
            ? !q.active
            : true;
    });
    this.deck.set(pick.map((q) => q.id));
    this.position.set(0);
    this.verdicts.set([]);
  }

  protected decide(verdict: Verdict): void {
    const question = this.cards()[0];
    if (!question || this.leaving()) {
      return;
    }
    this.leaving.set(verdict);
    if (question.active !== (verdict === 'keep')) {
      void this.store.setActive(question, verdict === 'keep');
    }
    setTimeout(() => {
      this.verdicts.update((list) => [...list, verdict]);
      this.position.update((p) => p + 1);
      this.leaving.set(null);
      this.dx.set(0);
    }, 260);
  }

  protected back(): void {
    if (this.position() > 0) {
      this.position.update((p) => p - 1);
      this.verdicts.update((list) => list.slice(0, -1));
    }
  }

  protected grab(event: PointerEvent): void {
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    const startX = event.clientX;
    this.dragging.set(true);
    const move = (e: PointerEvent) => this.dx.set(e.clientX - startX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      this.dragging.set(false);
      if (Math.abs(this.dx()) > SWIPE_PX) {
        this.decide(this.dx() > 0 ? 'keep' : 'pause');
      } else {
        this.dx.set(0);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  protected onKey(event: KeyboardEvent): void {
    if (this.store.editing() || this.store.confirm() || this.rulesOpen()) {
      return;
    }
    if ((event.target as HTMLElement).closest('input, textarea')) {
      return;
    }
    if (event.key === 'ArrowRight') {
      this.decide('keep');
    } else if (event.key === 'ArrowLeft') {
      this.decide('pause');
    } else if (event.key === 'Backspace') {
      this.back();
    } else if (event.key.toLowerCase() === 'e' && this.cards()[0]) {
      this.store.openEditor(this.cards()[0]!);
    }
  }

  protected transform(index: number): string {
    if (index > 0) {
      return `translateY(${index * 14}px) scale(${1 - index * 0.04})`;
    }
    const leaving = this.leaving();
    const x = leaving
      ? (leaving === 'keep' ? 1 : -1) * window.innerWidth
      : this.dx();
    return `translateX(${x}px) rotate(${x / 24}deg)`;
  }
}
