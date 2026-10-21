// TEMPORARY: proposal J «Workspace», the detail column of a question (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import {
  draftFrom,
  emptyDraft,
  hasErrors,
  validateDraft,
} from '../../questions/question-form';
import { apiErrorMessage, ProposalStore, successRate } from '../proposal-store';
import { QuestionFieldsComponent } from '../shared/question-fields.component';
import { QuestionPreviewComponent } from '../shared/question-preview.component';

@Component({
  selector: 'app-ws-inspector',
  imports: [QuestionFieldsComponent, QuestionPreviewComponent],
  template: `
    <div class="head">
      <div>
        <span class="eyebrow">{{
          question() ? 'Frage #' + question()!.id : 'Neu'
        }}</span>
        <h2>{{ question() ? 'Frage bearbeiten' : 'Neue Frage' }}</h2>
      </div>
      <button
        type="button"
        class="close"
        aria-label="Schliessen"
        (click)="closed.emit()"
      >
        <css-icon icon="close" size="sm"></css-icon>
      </button>
    </div>

    <div class="tabs" role="tablist">
      <button
        type="button"
        role="tab"
        [attr.aria-selected]="tab() === 'edit'"
        (click)="tab.set('edit')"
      >
        Bearbeiten
      </button>
      <button
        type="button"
        role="tab"
        [attr.aria-selected]="tab() === 'preview'"
        (click)="tab.set('preview')"
      >
        Vorschau im Spiel
      </button>
    </div>

    <div class="body">
      @if (tab() === 'edit') {
        @if (question(); as q) {
          <dl class="stats">
            <div>
              <dt>Richtig</dt>
              <dd [class.low]="(rate() ?? 100) < 20">
                {{ rate() === null ? '–' : rate() + ' %' }}
              </dd>
            </div>
            <div>
              <dt>Gestellt</dt>
              <dd>{{ q.timesAsked }}×</dd>
            </div>
            <div>
              <dt>Geändert</dt>
              <dd>{{ date(q.updatedAt) }}</dd>
            </div>
          </dl>
        }
        <app-question-fields
          [(draft)]="draft"
          [errors]="errors()"
          [categories]="store.categories()"
          [compact]="true"
        />
        @if (serverError()) {
          <p class="error" role="alert">{{ serverError() }}</p>
        }
      } @else {
        <app-question-preview
          [text]="draft().text"
          [options]="draft().options"
          [correctIndex]="draft().correctIndex"
          [category]="draft().category"
          [total]="store.settings()?.questionsPerGame ?? 3"
          [seconds]="store.settings()?.questionDurationSec ?? 20"
        />
      }
    </div>

    <div class="foot">
      @if (question(); as q) {
        <css-button
          variant="plain"
          (click)="store.confirm.set({ kind: 'delete', question: q })"
        >
          <css-icon icon="trash" slot="prefix"></css-icon>
          Löschen
        </css-button>
      }
      <span class="spacer"></span>
      @if (dirty()) {
        <css-button (click)="discard()">Verwerfen</css-button>
      }
      <css-button
        variant="primary"
        [disabled]="!dirty()"
        [loading]="store.saving()"
        (click)="save()"
      >
        {{ question() ? 'Speichern' : 'Erstellen' }}
      </css-button>
    </div>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';

    :host {
      display: flex;
      flex-direction: column;
      background-color: kit.$white;
    }

    .head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: functions.rem(16) functions.rem(16) functions.rem(8) functions.rem(20);

      h2 {
        margin: 0;
        font-size: functions.rem(19);
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
      }
    }

    .eyebrow {
      @include kit.eyebrow;
      font-size: functions.rem(11);
    }

    .close {
      display: grid;
      place-items: center;
      width: functions.rem(36);
      height: functions.rem(36);
      border: 0;
      border-radius: 50%;
      background: none;
      color: kit.$blue;
      cursor: pointer;

      &:hover {
        background-color: kit.$fill;
      }
    }

    .tabs {
      display: flex;
      gap: functions.rem(16);
      padding: 0 functions.rem(20);
      border-bottom: functions.rem(1) solid kit.$line;

      button {
        padding: functions.rem(10) 0;
        border: 0;
        border-bottom: functions.rem(2) solid transparent;
        margin-bottom: functions.rem(-1);
        background: none;
        font: inherit;
        font-size: functions.rem(14);
        color: kit.$muted;
        cursor: pointer;

        &[aria-selected='true'] {
          border-bottom-color: kit.$blue;
          font-weight: miscs.$css-ui-font-weight-bold;
          color: kit.$blue;
        }
      }
    }

    .body {
      display: grid;
      flex: 1 1 auto;
      align-content: start;
      gap: functions.rem(20);
      padding: functions.rem(20);
      overflow-y: auto;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      margin: 0;
      border: functions.rem(1) solid kit.$line;
      border-radius: functions.rem(4);

      div {
        padding: functions.rem(10) functions.rem(12);

        & + div {
          border-left: functions.rem(1) solid kit.$line;
        }
      }

      dt {
        font-size: functions.rem(12);
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
      margin: 0;
      color: kit.$red;
    }

    .foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: functions.rem(8);
      padding: functions.rem(12) functions.rem(16);
      border-top: functions.rem(1) solid kit.$line;
    }

    .spacer {
      flex: 1 1 auto;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WsInspectorComponent {
  protected readonly store = inject(ProposalStore);
  /** The question to edit; null for a new one. */
  readonly question = input<AdminQuestion | null>(null);
  readonly closed = output<void>();
  readonly saved = output<AdminQuestion>();
  readonly dirtyChange = output<boolean>();

  protected readonly tab = signal<'edit' | 'preview'>('edit');
  protected readonly draft = linkedSignal(() => {
    const q = this.question();
    return q ? draftFrom(q) : emptyDraft();
  });
  protected readonly submitted = linkedSignal(() => (this.question(), false));
  protected readonly serverError = signal('');
  protected readonly errors = computed(() =>
    this.submitted() ? validateDraft(this.draft()) : {},
  );
  protected readonly dirty = computed(() => {
    const q = this.question();
    return (
      JSON.stringify(q ? draftFrom(q) : emptyDraft()) !==
      JSON.stringify(this.draft())
    );
  });
  protected readonly rate = computed(() => {
    const q = this.question();
    return q ? successRate(q) : null;
  });

  constructor() {
    effect(() => this.dirtyChange.emit(this.dirty()));
  }

  protected date(value: string): string {
    return new Date(value).toLocaleDateString('de-CH');
  }

  protected discard(): void {
    const q = this.question();
    this.draft.set(q ? draftFrom(q) : emptyDraft());
    this.submitted.set(false);
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.serverError.set('');
    if (hasErrors(validateDraft(this.draft()))) {
      this.tab.set('edit');
      return;
    }
    this.store.saving.set(true);
    try {
      this.saved.emit(
        await this.store.saveQuestion(this.draft(), this.question()?.id ?? null),
      );
    } catch (error) {
      this.serverError.set(apiErrorMessage(error));
    } finally {
      this.store.saving.set(false);
    }
  }
}
