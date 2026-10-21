// TEMPORARY: the editor and delete dialogs shared by the proposals (development only).
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';
import '@css-ch/components/notification';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import { QuestionEditorComponent } from '../../questions/question-editor.component';
import { ProposalStore } from '../proposal-store';

@Component({
  selector: 'app-proposal-dialogs',
  imports: [QuestionEditorComponent],
  template: `
    @if (store.message(); as m) {
      <css-notification
        class="toast"
        size="sm"
        [variant]="m.variant"
        [title]="m.text"
        ariaLabelCloseButton="Schliessen"
        (close)="store.message.set(null)"
      ></css-notification>
    }

    @if (editor() && store.editing(); as e) {
      <app-question-editor
        [initial]="e.draft"
        [isNew]="e.id === null"
        [categories]="store.categories()"
        [saving]="store.saving()"
        [serverError]="store.editorError()"
        (save)="store.saveEditing($event)"
        (dismiss)="store.editing.set(null)"
      />
    }

    @if (store.confirm(); as c) {
      <css-flyout
        withoutCloseButton
        size="small"
        [title]="c.kind === 'delete' ? 'Frage löschen?' : 'Alle Fragen löschen?'"
        [main]="
          c.kind === 'delete'
            ? 'Die Frage wird endgültig gelöscht.'
            : 'Alle ' +
              store.counts().total +
              ' Fragen werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden.'
        "
      >
        <css-button slot="css-button" (click)="store.confirm.set(null)">
          Abbrechen
        </css-button>
        <css-button
          slot="css-button"
          variant="primary"
          [loading]="store.busy()"
          (click)="store.confirmAction()"
        >
          Endgültig löschen
        </css-button>
      </css-flyout>
    }
  `,
  styles: `
    @use '../kit';

    .toast {
      @include kit.toast;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProposalDialogsComponent {
  protected readonly store = inject(ProposalStore);
  /** False where the proposal shows its own editor. */
  readonly editor = input(true);
}
