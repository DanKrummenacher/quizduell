// Bühne: categories, data and the session.
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../../proposals/pro';
import { ProposalStore } from '../../proposals/proposal-store';
import { ImportDialogComponent } from '../../proposals/shared/import-dialog.component';

@Component({
  selector: 'app-buehne-more',
  imports: [ImportDialogComponent],
  template: `
    <header class="head">
      <h1>Mehr</h1>
    </header>

    <section class="panel">
      <h2>Kategorien</h2>
      <ul class="rows">
        @for (c of store.categoryStats(); track c.name) {
          <li class="row">
            @if (renaming() === c.name) {
              <form
                class="rename"
                (submit)="$event.preventDefault(); rename(c.name, field.value)"
              >
                <input #field [value]="c.name" aria-label="Neuer Name" />
                <button type="submit" class="small primary">Übernehmen</button>
                <button type="button" class="small" (click)="renaming.set(null)">
                  Abbrechen
                </button>
              </form>
            } @else {
              <span class="row-text">
                <strong>{{ c.name || 'Ohne Kategorie' }}</strong>
                <small
                  >{{ c.active }} von {{ c.total }} im Spiel{{
                    c.rate === null ? '' : ' · ' + c.rate + ' % richtig'
                  }}</small
                >
              </span>
              @if (c.name) {
                <button type="button" class="small" (click)="renaming.set(c.name)">
                  Umbenennen
                </button>
              }
              <button
                type="button"
                role="switch"
                class="switch"
                [attr.aria-checked]="c.active > 0"
                [attr.aria-label]="
                  'Kategorie im Spiel: ' + (c.name || 'Ohne Kategorie')
                "
                (click)="pro.setCategoryActive(c.name, c.active === 0)"
              ></button>
            }
          </li>
        } @empty {
          <li class="row">
            <span class="row-text"><small>Noch keine Kategorien.</small></span>
          </li>
        }
      </ul>
      @if (renaming()) {
        <p class="hint">
          Mit dem Namen einer bestehenden Kategorie werden beide zusammengeführt.
        </p>
      }
    </section>

    <section class="panel">
      <h2>Fragen-Daten</h2>
      <div class="actions">
        <button type="button" class="action" (click)="importing.set(true)">
          <span class="a-icon"><css-icon icon="upload"></css-icon></span>
          <span
            ><strong>Importieren</strong
            ><small>Fragen aus einer CSV-Datei, mit Vorschau</small></span
          >
        </button>
        <button type="button" class="action" (click)="pro.exportCsv()">
          <span class="a-icon"><css-icon icon="download"></css-icon></span>
          <span
            ><strong>Exportieren</strong
            ><small>Alle Fragen als CSV für Excel</small></span
          >
        </button>
        <button type="button" class="action" (click)="store.importSamples()">
          <span class="a-icon green"><css-icon icon="giftbox"></css-icon></span>
          <span
            ><strong>Beispielfragen</strong
            ><small>Das Startpaket hinzufügen</small></span
          >
        </button>
        <button
          type="button"
          class="action danger"
          (click)="store.confirm.set({ kind: 'delete-all' })"
        >
          <span class="a-icon red"><css-icon icon="trash"></css-icon></span>
          <span><strong>Alle löschen</strong><small>Mit Bestätigung</small></span>
        </button>
      </div>
    </section>

    <section class="panel">
      <h2>Sitzung</h2>
      <div class="session">
        <button type="button" class="big" (click)="openGame.emit()">
          <css-icon icon="home" size="sm"></css-icon>Zum Spiel
        </button>
        <button type="button" class="big outline" (click)="logout.emit()">
          <css-icon icon="logout" size="sm"></css-icon>Abmelden
        </button>
      </div>
    </section>

    @if (importing()) {
      <app-import-dialog (dismiss)="importing.set(false)" />
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'buehne' as b;

    :host {
      display: grid;
      gap: functions.rem(16);
    }

    .head h1 {
      @include b.title-xl;
    }

    .panel {
      @include b.card;
      padding: functions.rem(22);

      @media (min-width: 760px) {
        padding: functions.rem(28) functions.rem(32);
      }

      h2 {
        margin: 0 0 functions.rem(8);
        font-size: functions.rem(20);
        font-weight: miscs.$css-ui-font-weight-bold;
      }
    }

    .rows {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .row {
      display: flex;
      align-items: center;
      gap: functions.rem(12);
      min-height: functions.rem(68);
      border-bottom: functions.rem(1) solid b.$line;

      &:last-child {
        border-bottom: 0;
      }
    }

    .row-text {
      display: grid;
      flex: 1 1 auto;
      min-width: 0;

      strong {
        font-size: functions.rem(17);
      }

      small {
        font-size: functions.rem(14);
        color: b.$ink-2;
      }
    }

    .switch {
      @include b.switch;
    }

    .small {
      @include b.button(b.$soft, b.$ink);
      min-height: functions.rem(40);
      padding: 0 functions.rem(14);
      font-size: functions.rem(14);

      &.primary {
        background-color: b.$blue;
        color: b.$white;
      }
    }

    .rename {
      display: flex;
      flex: 1 1 auto;
      flex-wrap: wrap;
      gap: functions.rem(8);
      padding: functions.rem(10) 0;

      input {
        flex: 1 1 functions.rem(160);
        min-height: functions.rem(44);
        padding: 0 functions.rem(14);
        border: functions.rem(2) solid b.$blue;
        border-radius: functions.rem(22);
        font: inherit;
        font-size: functions.rem(16);
        color: b.$ink;
        outline: none;
      }
    }

    .hint {
      margin: functions.rem(8) 0 0;
      font-size: functions.rem(13);
      color: b.$ink-2;
    }

    .actions {
      display: grid;
      gap: functions.rem(10);

      @media (min-width: 700px) {
        grid-template-columns: 1fr 1fr;
      }
    }

    .action {
      display: flex;
      align-items: center;
      gap: functions.rem(14);
      min-height: functions.rem(76);
      padding: functions.rem(12) functions.rem(16);
      border: functions.rem(2) solid b.$line;
      border-radius: b.$radius-sm;
      background-color: b.$white;
      font: inherit;
      color: b.$ink;
      text-align: left;
      cursor: pointer;
      @include b.focus;

      &:active {
        background-color: b.$soft;
      }

      span:last-child {
        display: grid;
      }

      strong {
        font-size: functions.rem(16);
      }

      small {
        font-size: functions.rem(13);
        color: b.$ink-2;
      }

      &.danger strong {
        color: b.$red;
      }
    }

    .a-icon {
      display: grid;
      place-items: center;
      flex: none;
      width: functions.rem(44);
      height: functions.rem(44);
      border-radius: functions.rem(12);
      background-color: b.$blue;
      color: b.$white;

      &.green {
        background-color: b.$green;
      }

      &.red {
        background-color: b.$red;
      }
    }

    .session {
      display: flex;
      flex-wrap: wrap;
      gap: functions.rem(10);
    }

    .big {
      @include b.button(b.$blue, b.$white);

      &.outline {
        border: functions.rem(2) solid b.$line;
        background-color: b.$white;
        color: b.$ink;
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BuehneMoreComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly importing = signal(false);
  protected readonly renaming = signal<string | null>(null);

  protected async rename(from: string, to: string): Promise<void> {
    this.renaming.set(null);
    if (to.trim() && to.trim() !== from) {
      await this.pro.renameCategory(from, to);
    }
  }
}
