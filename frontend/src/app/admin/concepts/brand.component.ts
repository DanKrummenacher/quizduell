// TEMPORARY: the playduelio lockup for the concept screens (development only).
import { Component, input } from '@angular/core';
import { LogoMarkComponent } from '../../core/ui/logo-mark/logo-mark.component';

@Component({
  selector: 'app-concept-brand',
  imports: [LogoMarkComponent],
  template: `
    <app-logo-mark
      class="mark"
      [inverse]="inverse()"
      [style.width.px]="size()"
      [style.height.px]="size()"
    />
    <span class="word" [style.font-size.px]="size() * 0.72"
      ><span class="light">play</span>duelio</span
    >
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      line-height: 1;
    }

    .mark {
      display: block;
    }

    .word {
      font-weight: 700;
      letter-spacing: -0.01em;
      white-space: nowrap;
    }

    .light {
      font-weight: 300;
    }
  `,
})
export class ConceptBrandComponent {
  readonly inverse = input(false);
  readonly size = input(24);
}
