// TEMPORARY: confirm the changed rules with a before/after list (development only).
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, output } from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import { ProposalPro } from '../pro';
import { ProposalStore } from '../proposal-store';

@Component({
  selector: 'app-save-rules-dialog',
  template: `
    <css-flyout
      open
      size="small"
      withoutCloseButton
      title="Spielregeln speichern?"
      (close)="dismiss.emit()"
    >
      <div slot="content" class="content">
        <p class="lead">
          Gilt ab dem nächsten Duell. Laufende Duelle bleiben gleich.
        </p>
        <table>
          <tbody>
            @for (change of pro.settingChanges(); track change.label) {
              <tr>
                <th>{{ change.label }}</th>
                <td class="before">{{ change.before }}</td>
                <td class="arrow" aria-label="wird zu">→</td>
                <td class="after">{{ change.after }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (store.questionWarning(); as warning) {
          <p class="warning">{{ warning }}</p>
        }
      </div>
      <css-button slot="css-button" (click)="dismiss.emit()">Zurück</css-button>
      <css-button
        slot="css-button"
        variant="primary"
        [disabled]="!store.valid()"
        [loading]="store.saving()"
        (click)="save()"
      >
        Speichern
      </css-button>
    </css-flyout>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';

    .content {
      display: grid;
      gap: functions.rem(12);
    }

    .lead {
      margin: 0;
      color: kit.$muted;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      color: kit.$blue;
    }

    th,
    td {
      padding: functions.rem(8) 0;
      border-bottom: functions.rem(1) solid kit.$line;
      text-align: left;
    }

    th {
      font-weight: miscs.$css-ui-font-weight-regular;
    }

    .before {
      color: kit.$muted;
      text-decoration: line-through;
      text-align: right;
    }

    .arrow {
      width: functions.rem(32);
      color: kit.$muted;
      text-align: center;
    }

    .after {
      font-weight: miscs.$css-ui-font-weight-bold;
    }

    .warning {
      margin: 0;
      color: kit.$red;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SaveRulesDialogComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  readonly dismiss = output<void>();

  protected async save(): Promise<void> {
    await this.store.saveSettings();
    if (!this.store.dirty()) {
      this.dismiss.emit();
    }
  }
}
