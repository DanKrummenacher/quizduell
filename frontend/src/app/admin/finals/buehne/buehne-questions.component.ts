// Bühne: the questions as cards, by category.
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/icon';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { ProposalPro } from '../../proposals/pro';
import { ProposalStore, successRate } from '../../proposals/proposal-store';
import { BuehneState } from './buehne-state';

@Component({
  selector: 'app-buehne-questions',
  template: `
    <header class="head">
      <div>
        <h1>Fragen</h1>
        <p>{{ store.counts().active }} von {{ store.counts().total }} im Spiel</p>
      </div>
      <label class="search">
        <css-icon icon="search" size="sm"></css-icon>
        <span class="visually-hidden">Suchen</span>
        <input
          type="search"
          placeholder="Suchen"
          [value]="state.search()"
          (input)="state.search.set(value($event))"
        />
      </label>
    </header>

    <div class="chips" role="group" aria-label="Filter">
      <button
        type="button"
        class="chip"
        [class.on]="state.category() === null && !state.onlyIssues()"
        (click)="state.category.set(null); state.onlyIssues.set(false)"
      >
        Alle <span>{{ store.counts().total }}</span>
      </button>
      @if (pro.issueCount()) {
        <button
          type="button"
          class="chip warn"
          [class.on]="state.onlyIssues()"
          (click)="state.onlyIssues.set(!state.onlyIssues())"
        >
          Zu prüfen <span>{{ pro.issueCount() }}</span>
        </button>
      }
      @for (c of store.categoryStats(); track c.name) {
        <button
          type="button"
          class="chip"
          [class.on]="state.category() === c.name"
          (click)="state.category.set(state.category() === c.name ? null : c.name)"
        >
          {{ c.name || 'Ohne Kategorie' }} <span>{{ c.total }}</span>
        </button>
      }
    </div>

    <div class="grid">
      @for (q of cards(); track q.id) {
        @let r = rate(q);
        <article class="card" [class.off]="!q.active">
          <button
            type="button"
            class="open"
            [attr.aria-label]="'Bearbeiten: ' + q.text"
            (click)="state.editing.set(q.id)"
          >
            <span class="card-top">
              <span class="cat">{{ q.category || 'Ohne Kategorie' }}</span>
              <span class="rate" [class.low]="r !== null && r < 20">{{
                r === null ? 'Neu' : r + ' % richtig'
              }}</span>
            </span>
            <span class="text">{{ q.text }}</span>
            <span class="answers">
              @for (option of q.options; track $index; let i = $index) {
                <span class="answer" [class.right]="i === q.correctIndex">
                  <b>{{ letters[i] }}</b
                  >{{ option }}
                </span>
              }
            </span>
          </button>
          <div class="card-foot">
            <span class="state">{{ q.active ? 'Im Spiel' : 'Pausiert' }}</span>
            <button
              type="button"
              role="switch"
              class="switch"
              [attr.aria-checked]="q.active"
              [attr.aria-label]="'Im Spiel: ' + q.text"
              (click)="toggle(q.id, !q.active)"
            ></button>
          </div>
        </article>
      } @empty {
        <div class="empty">
          @if (store.questions() === null) {
            <p>Lädt …</p>
          } @else if (store.counts().total === 0) {
            <h2>Noch keine Fragen</h2>
            <p>Leg die erste Frage an oder lade das Beispielpaket.</p>
            <button type="button" class="light" (click)="store.importSamples()">
              Beispielfragen laden
            </button>
          } @else {
            <h2>Nichts gefunden</h2>
            <p>Keine Frage passt zu diesem Filter.</p>
          }
        </div>
      }
    </div>

    <button
      type="button"
      class="fab"
      aria-label="Neue Frage"
      (click)="state.editing.set('new')"
    >
      <css-icon icon="add"></css-icon><span>Neue Frage</span>
    </button>
  `,
  styleUrl: './buehne-questions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BuehneQuestionsComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(BuehneState);

  protected readonly letters = ANSWER_LETTERS;
  protected readonly rate = successRate;

  private readonly issueIds = computed(
    () => new Set(this.pro.issues().flatMap((i) => i.ids)),
  );
  protected readonly cards = computed(() => {
    const term = this.state.search().trim().toLowerCase();
    const category = this.state.category();
    return (this.store.questions() ?? []).filter(
      (q) =>
        (category === null || (q.category ?? '') === category) &&
        (!this.state.onlyIssues() || this.issueIds().has(q.id)) &&
        (!term ||
          [q.text, q.category ?? '', ...q.options].some((v) =>
            v.toLowerCase().includes(term),
          )),
    );
  });

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected async toggle(id: number, active: boolean): Promise<void> {
    const question = (this.store.questions() ?? []).find((q) => q.id === id);
    if (question) {
      await this.store.setActive(question, active);
      this.state.say(active ? 'Frage ist im Spiel' : 'Frage pausiert');
    }
  }
}
