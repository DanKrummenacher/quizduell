import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { LobbyDesign } from './lobby-design';

@Component({
  selector: 'app-lobby-searching-next',
  template: `
    <div class="screen-content" role="status">
      @if (design() === 'facelift') {
        <span class="symbol" aria-hidden="true">
          <css-icon icon="search" size="lg"></css-icon>
        </span>
      } @else {
        <div class="duo" aria-hidden="true">
          <span class="avatar">{{ initial() }}</span>
          <span class="duo-vs">vs</span>
          <span class="avatar is-unknown">?</span>
        </div>
      }
      <h1 class="title spaced">Suche Gegner&nbsp;…</h1>
      <p class="subtitle">Gleich geht’s los – wir suchen einen weiteren Spieler.</p>
      @if (design() === 'facelift') {
        <div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>
      }
    </div>

    <div class="actions">
      <css-button stretch (click)="cancelSearch.emit()">
        <css-icon icon="close" slot="prefix"></css-icon>
        Suche abbrechen
      </css-button>
    </div>
  `,
  styleUrl: './lobby-screen.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbySearchingNextComponent {
  readonly design = input.required<LobbyDesign>();
  readonly playerName = input.required<string>();
  readonly cancelSearch = output<void>();

  protected readonly initial = computed(() =>
    this.playerName().charAt(0).toUpperCase(),
  );
}
