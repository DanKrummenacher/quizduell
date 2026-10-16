import { Component, input } from '@angular/core';
import { LogoMarkComponent } from '../logo-mark/logo-mark.component';

/** Full-width gradient bar with app icon and wordmark, flush with the top edge. */
@Component({
  selector: 'app-brand-header',
  imports: [LogoMarkComponent],
  templateUrl: './brand-header.component.html',
  styleUrl: './brand-header.component.scss',
})
export class BrandHeaderComponent {
  /** Optional label shown as a chip on the right (e.g. "Admin"). */
  readonly label = input<string | null>(null);
  /** Logo in the middle (game) or at the start of the content column (admin). */
  readonly align = input<'center' | 'start'>('center');
}
