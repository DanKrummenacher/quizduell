// TEMPORARY: proposal K «Pocket», a question on its own page (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { emptyDraft, hasErrors, validateDraft } from '../../questions/question-form';
import { ProposalStore, successRate } from '../proposal-store';
import { QuestionFieldsComponent } from '../shared/question-fields.component';
import { QuestionPreviewComponent } from '../shared/question-preview.component';

/** Opens over the app whenever a question is being edited. */
@Component({
  selector: 'app-pocket-editor',
  imports: [QuestionFieldsComponent, QuestionPreviewComponent],
  template: `
    @if (store.editing(); as e) {
      <div
        class="page"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="e.id === null ? 'Neue Frage' : 'Frage bearbeiten'"
      >
        <header class="bar">
          <button type="button" class="bar-button" (click)="close()">
            <css-icon icon="angle-left" size="sm"></css-icon>Zurück
          </button>
          <span class="bar-title">{{
            e.id === null ? 'Neue Frage' : 'Bearbeiten'
          }}</span>
          <button
            type="button"
            class="bar-button strong"
            [disabled]="!dirty() || store.saving()"
            (click)="save()"
          >
            {{ store.saving() ? 'Sichert …' : 'Sichern' }}
          </button>
        </header>

        <div class="body">
          @if (question(); as q) {
            <div class="stats">
              <span
                ><strong>{{ rate() === null ? '–' : rate() + ' %' }}</strong>
                richtig</span
              >
              <span
                ><strong>{{ q.timesAsked }}×</strong> gestellt</span
              >
              <span class="state" [class.on]="q.active">{{
                q.active ? 'Im Spiel' : 'Pausiert'
              }}</span>
            </div>
          }

          <div class="card">
            <app-question-fields
              [(draft)]="draft"
              [errors]="errors()"
              [categories]="store.categories()"
              [compact]="true"
            />
          </div>

          @if (store.editorError()) {
            <p class="error" role="alert">{{ store.editorError() }}</p>
          }

          <button
            type="button"
            class="preview-toggle"
            [attr.aria-expanded]="preview()"
            (click)="preview.set(!preview())"
          >
            <css-icon icon="iphone" size="sm"></css-icon>
            So sehen es die Spieler
            <css-icon
              class="chev"
              [class.open]="preview()"
              icon="angle-down"
              size="sm"
            ></css-icon>
          </button>
          @if (preview()) {
            <app-question-preview
              [text]="draft().text"
              [options]="draft().options"
              [correctIndex]="draft().correctIndex"
              [category]="draft().category"
              [total]="store.settings()?.questionsPerGame ?? 3"
              [seconds]="store.settings()?.questionDurationSec ?? 20"
            />
          }

          @if (question(); as q) {
            <button
              type="button"
              class="delete"
              (click)="store.confirm.set({ kind: 'delete', question: q })"
            >
              Frage löschen
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';
    @use 'pocket';

    .page {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 50%;
      z-index: 14;
      display: flex;
      flex-direction: column;
      width: min(100%, #{functions.rem(480)});
      padding-top: var(--app-safe-top);
      background-color: pocket.$bg;
      transform: translateX(-50%);
      animation: push 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .bar {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      height: functions.rem(52);
      padding: 0 functions.rem(8);
      border-bottom: functions.rem(1) solid pocket.$sep;
      background-color: rgba(255, 255, 255, 0.94);
    }

    .bar-title {
      font-size: functions.rem(17);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$blue;
    }

    .bar-button {
      display: inline-flex;
      align-items: center;
      gap: functions.rem(2);
      justify-self: start;
      height: functions.rem(40);
      padding: 0 functions.rem(8);
      border: 0;
      background: none;
      font: inherit;
      font-size: functions.rem(16);
      color: kit.$blue;
      cursor: pointer;

      &.strong {
        justify-self: end;
        font-weight: miscs.$css-ui-font-weight-bold;
      }

      &:disabled {
        color: #a6b4c9;
        cursor: default;
      }
    }

    .body {
      display: grid;
      flex: 1 1 auto;
      align-content: start;
      gap: functions.rem(16);
      padding: functions.rem(16) functions.rem(16)
        calc(var(--app-safe-bottom) + #{functions.rem(32)});
      overflow-y: auto;
    }

    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: functions.rem(8) functions.rem(16);
      font-size: functions.rem(14);
      color: kit.$muted;

      strong {
        color: kit.$blue;
      }
    }

    .state {
      margin-left: auto;
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$red;

      &.on {
        color: kit.$green;
      }
    }

    .card {
      padding: functions.rem(16);
      border-radius: functions.rem(12);
      background-color: kit.$white;
    }

    .error {
      margin: 0;
      color: kit.$red;
    }

    .preview-toggle {
      display: flex;
      align-items: center;
      gap: functions.rem(10);
      min-height: functions.rem(52);
      padding: 0 functions.rem(16);
      border: 0;
      border-radius: functions.rem(12);
      background-color: kit.$white;
      font: inherit;
      color: kit.$blue;
      cursor: pointer;

      .chev {
        margin-left: auto;
        transition: transform 0.2s ease;

        &.open {
          transform: rotate(180deg);
        }
      }
    }

    .delete {
      min-height: functions.rem(52);
      border: 0;
      border-radius: functions.rem(12);
      background-color: kit.$white;
      font: inherit;
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$red;
      cursor: pointer;
    }

    @keyframes push {
      from {
        transform: translateX(-50%) translateX(#{functions.rem(40)});
        opacity: 0;
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PocketEditorComponent {
  protected readonly store = inject(ProposalStore);

  protected readonly preview = signal(false);
  protected readonly draft = linkedSignal(
    () => this.store.editing()?.draft ?? emptyDraft(),
  );
  protected readonly submitted = linkedSignal(() => (this.store.editing(), false));
  protected readonly errors = computed(() =>
    this.submitted() ? validateDraft(this.draft()) : {},
  );
  protected readonly question = computed(() => {
    const id = this.store.editing()?.id;
    return id === null || id === undefined
      ? null
      : ((this.store.questions() ?? []).find((q) => q.id === id) ?? null);
  });
  protected readonly rate = computed(() => {
    const q = this.question();
    return q ? successRate(q) : null;
  });
  protected readonly dirty = computed(
    () =>
      JSON.stringify(this.draft()) !== JSON.stringify(this.store.editing()?.draft),
  );

  protected close(): void {
    this.store.editing.set(null);
  }

  protected save(): void {
    this.submitted.set(true);
    if (!hasErrors(validateDraft(this.draft()))) {
      void this.store.saveEditing(this.draft());
    }
  }
}
