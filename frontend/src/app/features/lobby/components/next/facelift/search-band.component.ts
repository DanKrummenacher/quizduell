import { Component, computed, input } from '@angular/core';

/**
 * TEMPORARY (proposal «Duell-Band»): the header of the quiz page with you on
 * the left and the opponent still being searched on the right.
 */
@Component({
  selector: 'app-search-band',
  template: `
    <div class="band" aria-hidden="true">
      <div class="side me">
        <span class="avatar">{{ initial() }}</span>
        <span class="who">
          <span class="label">Du</span>
          <span class="name">{{ playerName() }}</span>
        </span>
      </div>
      <div class="side opponent">
        <span class="who">
          <span class="label">Gegner</span>
          <span class="name">gesucht</span>
        </span>
        <span class="avatar">?</span>
      </div>
      <span class="clock"><span class="clock-value">VS</span></span>
    </div>
  `,
  styleUrl: './search-band.component.scss',
})
export class SearchBandComponent {
  readonly playerName = input.required<string>();
  protected readonly initial = computed(() =>
    this.playerName().charAt(0).toUpperCase(),
  );
}
