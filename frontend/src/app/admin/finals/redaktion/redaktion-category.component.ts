// Redaktion: a category as a document of question blocks.
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../../proposals/pro';
import { ProposalStore } from '../../proposals/proposal-store';
import { RedaktionBlockComponent } from './redaktion-block.component';
import { RedaktionState } from './redaktion-state';

@Component({
  selector: 'app-redaktion-category',
  imports: [RedaktionBlockComponent],
  template: `
    <header class="head">
      <span class="crumb">Kategorie</span>
      <input
        class="title"
        aria-label="Name der Kategorie"
        [placeholder]="name() ? 'Name der Kategorie' : 'Ohne Kategorie'"
        [readOnly]="!name()"
        [value]="name()"
        (keydown.enter)="$any($event.target).blur()"
        (blur)="rename($any($event.target).value)"
      />
      <div class="facts">
        <span
          >{{ questions().length }}
          {{ questions().length === 1 ? 'Frage' : 'Fragen' }}</span
        >
        <span>{{ activeCount() }} im Spiel</span>
        @if (stat()?.rate !== null && stat()?.rate !== undefined) {
          <span>{{ stat()?.rate }} % richtig beantwortet</span>
        }
        <span class="spacer"></span>
        @if (questions().length) {
          <button
            type="button"
            class="quiet"
            (click)="pro.setCategoryActive(name(), activeCount() === 0)"
          >
            {{ activeCount() === 0 ? 'Alle ins Spiel nehmen' : 'Alle pausieren' }}
          </button>
        }
      </div>
    </header>

    <div class="blocks">
      @for (q of questions(); track q.id; let i = $index) {
        <app-redaktion-block [question]="q" [number]="i + 1" [category]="name()" />
      }
      @for (key of drafts(); track key; let i = $index) {
        <app-redaktion-block
          [category]="name()"
          [number]="questions().length + i + 1"
          (created)="claim($event)"
          (removed)="dropDraft(key)"
        />
      }
    </div>

    <button type="button" class="add" (click)="addDraft()">
      <css-icon icon="add" size="sm"></css-icon>Frage hinzufügen
    </button>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'redaktion' as r;

    :host {
      display: block;
    }

    .head {
      margin-bottom: functions.rem(20);
      padding-bottom: functions.rem(18);
      border-bottom: functions.rem(1) solid r.$line;
    }

    .crumb {
      font-size: functions.rem(13);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: r.$ink-3;
    }

    .title {
      @include r.bare;
      @include r.doc-title;
      margin-top: functions.rem(4);
      border-radius: functions.rem(6);

      &:not([readonly]):hover {
        background-color: r.$hover;
      }

      &:focus {
        background-color: r.$hover;
      }
    }

    .facts {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: functions.rem(6) functions.rem(16);
      margin-top: functions.rem(10);
      font-size: functions.rem(14);
      color: r.$ink-2;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .quiet {
      @include r.quiet-button;
    }

    .blocks {
      display: grid;
      gap: functions.rem(4);
    }

    .add {
      @include r.quiet-button;
      height: functions.rem(44);
      margin: functions.rem(12) 0 0 functions.rem(28);
      padding: 0 functions.rem(14);
      font-size: functions.rem(15);
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RedaktionCategoryComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  private readonly state = inject(RedaktionState);
  readonly name = input.required<string>();

  /** Blocks being written, and the ids they got when first saved. */
  protected readonly drafts = signal<number[]>([]);
  private readonly claimed = signal<ReadonlySet<number>>(new Set());
  private nextDraft = 1;

  protected readonly questions = computed(() =>
    (this.store.questions() ?? [])
      .filter((q) => (q.category ?? '') === this.name() && !this.claimed().has(q.id))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );
  protected readonly stat = computed(() =>
    this.store.categoryStats().find((c) => c.name === this.name()),
  );
  protected readonly activeCount = computed(
    () =>
      (this.store.questions() ?? []).filter(
        (q) => (q.category ?? '') === this.name() && q.active,
      ).length,
  );

  constructor() {
    // Another category: start fresh; an empty new category starts with a block.
    effect(() => {
      const name = this.name();
      untracked(() => {
        this.drafts.set([]);
        this.claimed.set(new Set());
        const empty = !(this.store.questions() ?? []).some(
          (q) => (q.category ?? '') === name,
        );
        if (empty) {
          this.addDraft();
        }
      });
    });
  }

  protected addDraft(): void {
    this.drafts.update((list) => [...list, this.nextDraft++]);
  }

  protected dropDraft(key: number): void {
    this.drafts.update((list) => list.filter((k) => k !== key));
  }

  /** A new block was saved: it stays where it is, not twice in the list. */
  protected claim(id: number): void {
    this.claimed.update((set) => new Set(set).add(id));
  }

  protected async rename(value: string): Promise<void> {
    const to = value.trim();
    const from = this.name();
    if (!from || !to || to === from) {
      return;
    }
    // With the name of an existing category, both are merged.
    await this.pro.renameCategory(from, to);
    this.store.message.set(null);
    this.state.open({ kind: 'category', name: to });
  }
}
