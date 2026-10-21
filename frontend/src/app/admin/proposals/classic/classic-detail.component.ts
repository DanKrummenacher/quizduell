// TEMPORARY: proposal L «Klassik», one question on its own page (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import {
  draftFrom,
  emptyDraft,
  hasErrors,
  validateDraft,
} from '../../questions/question-form';
import { apiErrorMessage, ProposalStore, successRate } from '../proposal-store';
import { QuestionFieldsComponent } from '../shared/question-fields.component';
import { QuestionPreviewComponent } from '../shared/question-preview.component';
import { ClassicSavebarComponent } from './classic-savebar.component';
import { ClassicState } from './classic-state';

@Component({
  selector: 'app-classic-detail',
  imports: [
    QuestionFieldsComponent,
    QuestionPreviewComponent,
    ClassicSavebarComponent,
  ],
  template: `
    @if (dirty()) {
      <app-classic-savebar
        [text]="
          isNew() ? 'Neue Frage nicht gespeichert' : 'Ungespeicherte Änderungen'
        "
        [saving]="store.saving()"
        (save)="save()"
        (discard)="discard()"
      />
    }

    <button type="button" class="back" (click)="leave()">
      <css-icon icon="angle-left" size="sm"></css-icon>Fragen
    </button>
    <header class="head">
      <h1>{{ isNew() ? 'Frage hinzufügen' : 'Frage bearbeiten' }}</h1>
      @if (question(); as q) {
        <span class="badge" [class.on]="q.active">{{
          q.active ? 'Aktiv' : 'Pausiert'
        }}</span>
      }
    </header>

    @if (isNew() || question()) {
      <div class="layout">
        <section class="card main">
          <app-question-fields
            [(draft)]="draft"
            [errors]="errors()"
            [categories]="store.categories()"
          />
          @if (serverError()) {
            <p class="error" role="alert">{{ serverError() }}</p>
          }
        </section>

        <aside class="side">
          @if (question(); as q) {
            <section class="card">
              <h2>Statistik</h2>
              <dl class="stats">
                <div>
                  <dt>Richtig beantwortet</dt>
                  <dd [class.low]="(rate() ?? 100) < 20">
                    {{ rate() === null ? '–' : rate() + ' %' }}
                  </dd>
                </div>
                <div>
                  <dt>Gestellt</dt>
                  <dd>{{ q.timesAsked }}×</dd>
                </div>
                <div>
                  <dt>Erstellt</dt>
                  <dd>{{ date(q.createdAt) }}</dd>
                </div>
                <div>
                  <dt>Geändert</dt>
                  <dd>{{ date(q.updatedAt) }}</dd>
                </div>
              </dl>
            </section>
          }
          <section class="card">
            <h2>Vorschau im Spiel</h2>
            <app-question-preview
              [text]="draft().text"
              [options]="draft().options"
              [correctIndex]="draft().correctIndex"
              [category]="draft().category"
              [total]="store.settings()?.questionsPerGame ?? 3"
              [seconds]="store.settings()?.questionDurationSec ?? 20"
            />
          </section>
        </aside>
      </div>

      <div class="foot">
        @if (question(); as q) {
          <button
            type="button"
            class="button danger"
            (click)="store.confirm.set({ kind: 'delete', question: q })"
          >
            Frage löschen
          </button>
        }
        <span class="spacer"></span>
        <button
          type="button"
          class="button primary"
          [disabled]="!dirty() || store.saving()"
          (click)="save()"
        >
          Speichern
        </button>
      </div>
    } @else {
      <p class="gone">Diese Frage gibt es nicht mehr.</p>
    }

    @if (leaving()) {
      <css-flyout
        withoutCloseButton
        size="small"
        title="Änderungen verwerfen?"
        main="Wenn du die Seite verlässt, gehen die Änderungen verloren."
      >
        <css-button slot="css-button" (click)="leaving.set(false)"
          >Weiter bearbeiten</css-button
        >
        <css-button
          slot="css-button"
          variant="primary"
          (click)="state.go({ name: 'questions' })"
          >Verwerfen</css-button
        >
      </css-flyout>
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';
    @use 'classic';

    .back {
      @include classic.back;
    }

    .head {
      @include classic.head;
      justify-content: flex-start;
    }

    .badge {
      padding: functions.rem(2) functions.rem(10);
      border-radius: functions.rem(10);
      background-color: #eef1f6;
      font-size: functions.rem(12);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$muted;

      &.on {
        background-color: #dff3ea;
        color: #00704e;
      }
    }

    .layout {
      display: grid;
      gap: functions.rem(20);
      align-items: start;

      @media (min-width: 1000px) {
        grid-template-columns: minmax(0, 1fr) functions.rem(360);
      }
    }

    .card {
      @include classic.card;
      padding: functions.rem(20);

      h2 {
        @include classic.card-title;
      }
    }

    .main {
      padding: functions.rem(24);
    }

    .side {
      display: grid;
      gap: functions.rem(20);
    }

    .stats {
      display: grid;
      gap: functions.rem(10);
      margin: 0;

      div {
        display: flex;
        justify-content: space-between;
        font-size: functions.rem(14);
      }

      dt {
        color: kit.$muted;
      }

      dd {
        margin: 0;
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;

        &.low {
          color: kit.$red;
        }
      }
    }

    .error {
      margin: functions.rem(16) 0 0;
      color: kit.$red;
    }

    .foot {
      display: flex;
      gap: functions.rem(8);
      margin-top: functions.rem(20);
      padding-top: functions.rem(20);
      border-top: functions.rem(1) solid #dfe5ee;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .button {
      @include classic.button;

      &.primary {
        @include classic.button(true);
      }

      &.danger {
        border-color: #f1c4bb;
        color: kit.$red;
      }
    }

    .gone {
      color: kit.$muted;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClassicDetailComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly state = inject(ClassicState);

  private readonly id = computed(() => {
    const page = this.state.page();
    return page.name === 'question' ? page.id : null;
  });
  protected readonly isNew = computed(() => this.id() === 'new');
  protected readonly question = computed(() => {
    const id = this.id();
    return typeof id === 'number'
      ? ((this.store.questions() ?? []).find((q) => q.id === id) ?? null)
      : null;
  });
  private readonly source = computed(() => {
    const q = this.question();
    return q ? draftFrom(q) : emptyDraft();
  });
  protected readonly draft = linkedSignal(() => this.source());
  protected readonly submitted = linkedSignal(() => (this.id(), false));
  protected readonly serverError = signal('');
  protected readonly leaving = signal(false);
  protected readonly errors = computed(() =>
    this.submitted() ? validateDraft(this.draft()) : {},
  );
  protected readonly dirty = computed(
    () => JSON.stringify(this.source()) !== JSON.stringify(this.draft()),
  );
  protected readonly rate = computed(() => {
    const q = this.question();
    return q ? successRate(q) : null;
  });

  constructor() {
    // A deleted question leads back to the list.
    effect(() => {
      if (
        typeof this.id() === 'number' &&
        this.store.questions() &&
        !this.question()
      ) {
        this.state.go({ name: 'questions' });
      }
    });
  }

  protected date(value: string): string {
    return new Date(value).toLocaleDateString('de-CH');
  }

  protected leave(): void {
    if (this.dirty()) {
      this.leaving.set(true);
    } else {
      this.state.go({ name: 'questions' });
    }
  }

  protected discard(): void {
    this.draft.set(this.source());
    this.submitted.set(false);
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.serverError.set('');
    if (hasErrors(validateDraft(this.draft()))) {
      return;
    }
    this.store.saving.set(true);
    try {
      const saved = await this.store.saveQuestion(
        this.draft(),
        this.question()?.id ?? null,
      );
      if (this.isNew()) {
        this.state.go({ name: 'question', id: saved.id });
      }
    } catch (error) {
      this.serverError.set(apiErrorMessage(error));
    } finally {
      this.store.saving.set(false);
    }
  }
}
