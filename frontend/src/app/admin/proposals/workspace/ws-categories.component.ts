// TEMPORARY: proposal J «Workspace», categories (development only).
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/switch';
import { eventChecked } from '../../../core/ui/component-events';
import { ProposalPro } from '../pro';
import { ProposalStore } from '../proposal-store';
import { WorkspaceNav } from './workspace-nav';

const NONE = '__none__';

/**
 * Categories exist through their questions. Here they are renamed – with
 * the name of another category, both are merged – and switched on or off
 * as a whole.
 */
@Component({
  selector: 'app-ws-categories',
  template: `
    <header class="head">
      <div>
        <h1>Kategorien</h1>
        <p>Umbenennen, zusammenführen und ganze Kategorien an- oder ausschalten.</p>
      </div>
    </header>

    <div class="panel">
      <table class="table">
        <thead>
          <tr>
            <th>Kategorie</th>
            <th class="num">Fragen</th>
            <th class="c-rate">Richtig</th>
            <th>Im Spiel</th>
            <th><span class="visually-hidden">Aktionen</span></th>
          </tr>
        </thead>
        <tbody>
          @for (c of store.categoryStats(); track c.name) {
            <tr>
              <td>
                @if (editing() === c.name) {
                  <form
                    class="rename"
                    (submit)="$event.preventDefault(); rename(c.name, field.value)"
                  >
                    <input
                      #field
                      class="rename-input"
                      list="ws-category-names"
                      aria-label="Neuer Name"
                      [value]="c.name"
                    />
                    <button type="submit" class="small primary">Übernehmen</button>
                    <button type="button" class="small" (click)="editing.set(null)">
                      Abbrechen
                    </button>
                  </form>
                  <span class="rename-hint"
                    >Mit dem Namen einer bestehenden Kategorie werden beide
                    zusammengeführt.</span
                  >
                } @else {
                  <span class="name">{{ c.name || 'Ohne Kategorie' }}</span>
                }
              </td>
              <td class="num">{{ c.active }} / {{ c.total }}</td>
              <td class="c-rate">
                <span class="rate">
                  <span class="meter" [style.--value]="c.rate ?? 0"></span>
                  {{ c.rate === null ? '–' : c.rate + ' %' }}
                </span>
              </td>
              <td>
                <css-switch
                  [label]="
                    c.active === c.total
                      ? 'Alle'
                      : c.active === 0
                        ? 'Keine'
                        : 'Teilweise'
                  "
                  [checked]="c.active > 0"
                  (change)="pro.setCategoryActive(c.name, checked($event))"
                ></css-switch>
              </td>
              <td class="row-actions">
                <button
                  type="button"
                  class="small"
                  (click)="nav.go('questions', null, c.name || none)"
                >
                  Fragen
                </button>
                @if (c.name) {
                  <button type="button" class="small" (click)="editing.set(c.name)">
                    Umbenennen
                  </button>
                }
                <button
                  type="button"
                  class="small"
                  (click)="store.openEditor(null, { category: c.name })"
                >
                  + Frage
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" class="empty">Noch keine Kategorien.</td>
            </tr>
          }
        </tbody>
      </table>
      <datalist id="ws-category-names">
        @for (name of store.categories(); track name) {
          <option [value]="name"></option>
        }
      </datalist>
    </div>
    @if (pro.progress(); as p) {
      <p class="progress">Wird übernommen: {{ p.done }} / {{ p.total }} …</p>
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'interaction';
    @use '../kit';
    @use 'ws';

    :host {
      display: block;
      max-width: functions.rem(1100);
    }

    .head {
      @include ws.head;
    }

    .panel {
      @include ws.panel;
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: functions.rem(14);
      color: kit.$blue;
    }

    th,
    td {
      padding: functions.rem(12) functions.rem(14);
      border-bottom: functions.rem(1) solid kit.$line;
      text-align: left;
      vertical-align: middle;
    }

    th {
      background-color: #f9fafc;
      font-size: functions.rem(12);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$muted;
    }

    .name {
      font-weight: miscs.$css-ui-font-weight-bold;
    }

    .num {
      white-space: nowrap;
    }

    .rate {
      display: inline-flex;
      align-items: center;
      gap: functions.rem(8);
      white-space: nowrap;
    }

    .meter {
      @include kit.meter(kit.$green);
      width: functions.rem(80);
    }

    @media (max-width: 700px) {
      .c-rate {
        display: none;
      }
    }

    .row-actions {
      text-align: right;
      white-space: nowrap;
    }

    .small {
      height: functions.rem(32);
      padding: 0 functions.rem(10);
      border: functions.rem(1) solid kit.$line;
      border-radius: functions.rem(4);
      background-color: kit.$white;
      font: inherit;
      font-size: functions.rem(13);
      color: kit.$blue;
      @include interaction.chip;

      &.primary {
        border-color: kit.$blue;
        background-color: kit.$blue;
        color: kit.$white;
      }
    }

    .rename {
      display: flex;
      flex-wrap: wrap;
      gap: functions.rem(6);
    }

    .rename-input {
      @include ws.control;
      height: functions.rem(32);
      min-width: functions.rem(160);
    }

    .rename-hint {
      display: block;
      margin-top: functions.rem(6);
      font-size: functions.rem(12);
      color: kit.$muted;
    }

    .empty {
      color: kit.$muted;
      text-align: center;
    }

    .progress {
      color: kit.$blue;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WsCategoriesComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly nav = inject(WorkspaceNav);

  protected readonly none = NONE;
  protected readonly editing = signal<string | null>(null);
  protected readonly checked = eventChecked;

  protected async rename(from: string, to: string): Promise<void> {
    this.editing.set(null);
    if (to.trim() && to.trim() !== from) {
      await this.pro.renameCategory(from, to);
    }
  }
}
