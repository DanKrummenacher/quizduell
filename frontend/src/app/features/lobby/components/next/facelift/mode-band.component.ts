import { Component, computed, input } from '@angular/core';

/**
 * TEMPORARY (proposal «Duell-Vorschau»): the header of the quiz page with
 * you on the left and the still unknown opponent on the right.
 */
@Component({
  selector: 'app-mode-band',
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
          <span class="name">noch offen</span>
        </span>
        <span class="avatar">?</span>
      </div>
      <span class="clock"><span class="clock-value">VS</span></span>
    </div>
  `,
  styleUrl: './mode-band.component.scss',
})
export class ModeBandComponent {
  readonly playerName = input.required<string>();
  protected readonly initial = computed(() =>
    this.playerName().charAt(0).toUpperCase(),
  );
}
