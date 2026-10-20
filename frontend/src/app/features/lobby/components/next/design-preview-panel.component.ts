// TEMPORARY: panel to switch between lobby designs (development only).
import { Component, model } from '@angular/core';
import type { LobbyState } from '../../lobby.types';
import {
  LOBBY_DESIGNS,
  MATCH_LAYOUTS,
  PREVIEW_SCREENS,
  type LobbyDesign,
  type MatchLayout,
} from './lobby-design';

@Component({
  selector: 'app-lobby-design-panel',
  template: `
    <details class="panel">
      <summary>Vorschau</summary>
      <label>
        Design
        <select [value]="design()" (change)="design.set($any(value($event)))">
          @for (option of designs; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </label>
      <label>
        Gegner gefunden
        <select [value]="match()" (change)="match.set($any(value($event)))">
          @for (option of matches; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </label>
      <label>
        Seite
        <select
          [value]="screen() ?? ''"
          (change)="screen.set($any(value($event)) || null)"
        >
          @for (option of screens; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </label>
    </details>
  `,
  styles: `
    .panel {
      position: fixed;
      top: calc(var(--app-safe-top) + 0.75rem);
      right: 0.75rem;
      z-index: 10;
      display: grid;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      border: 1px solid #00327d;
      border-radius: 0.75rem;
      background: #fff;
      color: #00327d;
      font-size: 0.8125rem;
      box-shadow: 0 0.25rem 0.75rem rgba(0, 50, 125, 0.12);
    }
    summary {
      font-weight: 700;
      cursor: pointer;
    }
    label {
      display: grid;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }
    select {
      font: inherit;
      padding: 0.25rem;
    }
  `,
})
export class LobbyDesignPanelComponent {
  readonly design = model<LobbyDesign>('today');
  readonly screen = model<LobbyState | null>(null);

  readonly match = model<MatchLayout>('facelift');

  protected readonly designs = LOBBY_DESIGNS;
  protected readonly matches = MATCH_LAYOUTS;
  protected readonly screens = PREVIEW_SCREENS;

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
