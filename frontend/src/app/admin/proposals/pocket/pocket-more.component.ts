// TEMPORARY: proposal K «Pocket», the more tab (development only).
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import '@css-ch/components/switch';
import { eventChecked } from '../../../core/ui/component-events';
import { ProposalPro } from '../pro';
import { ProposalStore } from '../proposal-store';
import { ImportDialogComponent } from '../shared/import-dialog.component';

@Component({
  selector: 'app-pocket-more',
  imports: [ImportDialogComponent],
  template: `
    <h1 class="title">Mehr</h1>

    <span class="label">Kategorien</span>
    <ul class="group">
      @for (c of store.categoryStats(); track c.name) {
        <li class="row">
          @if (renaming() === c.name) {
            <form
              class="rename"
              (submit)="$event.preventDefault(); rename(c.name, field.value)"
            >
              <input #field [value]="c.name" aria-label="Neuer Name" />
              <button type="submit">OK</button>
            </form>
          } @else {
            <button
              type="button"
              class="grow name"
              [disabled]="!c.name"
              (click)="renaming.set(c.name)"
            >
              {{ c.name || 'Ohne Kategorie' }}
              <small
                >{{ c.active }}/{{ c.total }} im Spiel{{
                  c.name ? ' · umbenennen' : ''
                }}</small
              >
            </button>
            <css-switch
              [label]="c.active ? 'An' : 'Aus'"
              [checked]="c.active > 0"
              (change)="pro.setCategoryActive(c.name, checked($event))"
            ></css-switch>
          }
        </li>
      }
    </ul>

    <span class="label">Fragen</span>
    <ul class="group">
      <li>
        <button type="button" class="row" (click)="importing.set(true)">
          <span class="tile"><css-icon icon="upload" size="sm"></css-icon></span>
          <span class="grow">Aus CSV importieren</span>
        </button>
      </li>
      <li>
        <button type="button" class="row" (click)="pro.exportCsv()">
          <span class="tile"><css-icon icon="download" size="sm"></css-icon></span>
          <span class="grow">Als CSV exportieren</span>
        </button>
      </li>
      <li>
        <button type="button" class="row" (click)="store.importSamples()">
          <span class="tile green"
            ><css-icon icon="giftbox" size="sm"></css-icon
          ></span>
          <span class="grow">Beispielfragen laden</span>
        </button>
      </li>
      <li>
        <button
          type="button"
          class="row danger"
          (click)="store.confirm.set({ kind: 'delete-all' })"
        >
          <span class="tile red"><css-icon icon="trash" size="sm"></css-icon></span>
          <span class="grow">Alle Fragen löschen</span>
        </button>
      </li>
    </ul>

    <span class="label">Sitzung</span>
    <ul class="group">
      <li>
        <button type="button" class="row" (click)="openGame.emit()">
          <span class="tile"><css-icon icon="home" size="sm"></css-icon></span>
          <span class="grow">Zum Spiel</span>
        </button>
      </li>
      <li>
        <button type="button" class="row" (click)="logout.emit()">
          <span class="tile"><css-icon icon="logout" size="sm"></css-icon></span>
          <span class="grow">Abmelden</span>
        </button>
      </li>
    </ul>

    @if (importing()) {
      <app-import-dialog (dismiss)="importing.set(false)" />
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';
    @use 'pocket';

    :host {
      display: block;
      padding-top: functions.rem(24);
    }

    .title {
      @include pocket.large-title;
    }

    .label {
      @include pocket.section-label;
    }

    .group {
      @include pocket.group;
    }

    .row {
      @include pocket.row-button;

      &.danger {
        color: kit.$red;
      }
    }

    li + li .row,
    li + li.row {
      box-shadow: inset 0 functions.rem(1) 0 pocket.$sep;
    }

    li.row {
      cursor: default;
    }

    .grow {
      flex: 1 1 auto;
    }

    .name {
      display: grid;
      padding: 0;
      border: 0;
      background: none;
      font: inherit;
      color: kit.$blue;
      text-align: left;
      cursor: pointer;

      small {
        font-size: functions.rem(13);
        color: kit.$muted;
      }

      &:disabled {
        cursor: default;
      }
    }

    .rename {
      display: flex;
      flex: 1 1 auto;
      gap: functions.rem(8);

      input {
        flex: 1 1 auto;
        min-width: 0;
        height: functions.rem(40);
        padding: 0 functions.rem(10);
        border: functions.rem(1) solid kit.$border;
        border-radius: functions.rem(8);
        font: inherit;
        color: kit.$blue;
      }

      button {
        padding: 0 functions.rem(14);
        border: 0;
        border-radius: functions.rem(8);
        background-color: kit.$blue;
        font: inherit;
        color: kit.$white;
        cursor: pointer;
      }
    }

    .tile {
      @include pocket.icon-tile;

      &.green {
        background-color: kit.$green;
      }

      &.red {
        background-color: kit.$red;
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PocketMoreComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly checked = eventChecked;
  protected readonly importing = signal(false);
  protected readonly renaming = signal<string | null>(null);

  protected async rename(from: string, to: string): Promise<void> {
    this.renaming.set(null);
    if (to.trim() && to.trim() !== from) {
      await this.pro.renameCategory(from, to);
    }
  }
}
