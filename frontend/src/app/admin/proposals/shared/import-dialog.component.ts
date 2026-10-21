// TEMPORARY: CSV import with a preview, shared by the proposals J–L (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { type ImportRow, ProposalPro } from '../pro';

/**
 * Questions prepared in Excel come in as CSV: the file is checked row by row
 * first, faulty rows and duplicates are shown and left out.
 */
@Component({
  selector: 'app-import-dialog',
  template: `
    <css-flyout
      open
      size="large"
      withoutCloseButton
      footerSpaceBetween
      title="Fragen aus CSV importieren"
      (close)="dismiss.emit()"
    >
      <div slot="content" class="content">
        @if (rows() === null) {
          <label
            class="drop"
            [class.over]="over()"
            (dragover)="$event.preventDefault(); over.set(true)"
            (dragleave)="over.set(false)"
            (drop)="drop($event)"
          >
            <css-icon icon="upload-document" size="xl"></css-icon>
            <strong>CSV-Datei hierher ziehen oder auswählen</strong>
            <span
              >Spalten: Frage; Antwort A–D; Richtig (A–D); Kategorie; Aktiv
              (ja/nein)</span
            >
            <input type="file" accept=".csv,text/csv" (change)="pick($event)" />
          </label>
          <button type="button" class="link" (click)="template()">
            Vorlage herunterladen (mit allen bestehenden Fragen)
          </button>
        } @else {
          <div class="summary">
            <span class="ok"
              ><strong>{{ counts().ok }}</strong> werden importiert</span
            >
            @if (counts().duplicate) {
              <span class="dup"
                ><strong>{{ counts().duplicate }}</strong> gibt es schon</span
              >
            }
            @if (counts().error) {
              <span class="err"
                ><strong>{{ counts().error }}</strong> mit Fehlern</span
              >
            }
            <button type="button" class="link" (click)="rows.set(null)">
              Andere Datei
            </button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Zeile</th>
                  <th>Frage</th>
                  <th>Richtig</th>
                  <th>Kategorie</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.line) {
                  <tr
                    [class.bad]="!!row.error"
                    [class.dup]="row.duplicate && !row.error"
                  >
                    <td>{{ row.line }}</td>
                    <td class="text">{{ row.draft.text || '–' }}</td>
                    <td>
                      {{ letters[row.draft.correctIndex] }} ·
                      {{ row.draft.options[row.draft.correctIndex] }}
                    </td>
                    <td>{{ row.draft.category || '–' }}</td>
                    <td class="state">
                      {{ row.error ?? (row.duplicate ? 'Gibt es schon' : 'Bereit') }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (pro.progress(); as p) {
          <p class="progress">Importiere {{ p.done }} / {{ p.total }} …</p>
        }
      </div>

      <css-button slot="css-button" (click)="dismiss.emit()">Abbrechen</css-button>
      <css-button
        slot="css-button"
        variant="primary"
        [disabled]="!counts().ok"
        [loading]="!!pro.progress()"
        (click)="run()"
      >
        {{ counts().ok }} {{ counts().ok === 1 ? 'Frage' : 'Fragen' }} importieren
      </css-button>
    </css-flyout>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';

    .content {
      display: grid;
      gap: functions.rem(16);
    }

    .drop {
      position: relative;
      display: grid;
      justify-items: center;
      gap: functions.rem(8);
      padding: functions.rem(40) functions.rem(16);
      border: functions.rem(2) dashed kit.$border;
      border-radius: functions.rem(4);
      background-color: kit.$fill;
      color: kit.$blue;
      text-align: center;
      cursor: pointer;

      &.over,
      &:focus-within {
        border-color: kit.$blue;
      }

      span {
        font-size: functions.rem(13);
        color: kit.$muted;
      }

      input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }
    }

    .link {
      justify-self: start;
      padding: 0;
      border: 0;
      background: none;
      font: inherit;
      font-size: functions.rem(14);
      color: kit.$blue;
      text-decoration: underline;
      cursor: pointer;
    }

    .summary {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: functions.rem(8) functions.rem(16);
      font-size: functions.rem(14);

      .ok {
        color: kit.$green;
      }

      .dup {
        color: #8a5a00;
      }

      .err {
        color: kit.$red;
      }

      .link {
        margin-left: auto;
      }
    }

    .table-wrap {
      max-height: functions.rem(360);
      overflow: auto;
      border: functions.rem(1) solid kit.$line;
      border-radius: functions.rem(4);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: functions.rem(13);
      color: kit.$blue;
    }

    th,
    td {
      padding: functions.rem(8) functions.rem(10);
      border-bottom: functions.rem(1) solid kit.$line;
      text-align: left;
      vertical-align: top;
    }

    th {
      position: sticky;
      top: 0;
      background-color: kit.$fill;
      font-weight: miscs.$css-ui-font-weight-bold;
    }

    .text {
      min-width: functions.rem(220);
    }

    .state {
      color: kit.$green;
    }

    tr.dup .state {
      color: #8a5a00;
    }

    tr.bad {
      background-color: #fdf3f1;

      .state {
        color: kit.$red;
      }
    }

    .progress {
      margin: 0;
      color: kit.$blue;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImportDialogComponent {
  protected readonly pro = inject(ProposalPro);
  readonly dismiss = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly rows = signal<ImportRow[] | null>(null);
  protected readonly over = signal(false);
  protected readonly counts = computed(() => {
    const rows = this.rows() ?? [];
    return {
      ok: rows.filter((r) => !r.error && !r.duplicate).length,
      duplicate: rows.filter((r) => !r.error && r.duplicate).length,
      error: rows.filter((r) => r.error).length,
    };
  });

  protected pick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      void this.read(file);
    }
  }

  protected drop(event: DragEvent): void {
    event.preventDefault();
    this.over.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      void this.read(file);
    }
  }

  protected template(): void {
    this.pro.exportCsv();
  }

  protected async run(): Promise<void> {
    const rows = this.rows();
    if (rows) {
      await this.pro.runImport(rows);
      this.dismiss.emit();
    }
  }

  private async read(file: File): Promise<void> {
    this.rows.set(this.pro.readImport(await file.text()));
  }
}
