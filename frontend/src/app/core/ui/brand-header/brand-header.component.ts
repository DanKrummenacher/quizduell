import { Component, computed, inject, input } from '@angular/core';
import { BrandingStore, type HeaderVariant } from '../../branding/branding.store';
import { LogoMarkComponent } from '../logo-mark/logo-mark.component';

/** App header with logo, wordmark and subtitle. Content with [headerEnd] goes right. */
@Component({
  selector: 'app-brand-header',
  imports: [LogoMarkComponent],
  templateUrl: './brand-header.component.html',
  styleUrl: './brand-header.component.scss',
  host: { '[class]': "'variant-' + variant()" },
})
export class BrandHeaderComponent {
  private readonly branding = inject(BrandingStore);

  readonly subtitle = input('Quizduell Challenge');
  /** Overrides the selected variant (used by the design preview). */
  readonly design = input<HeaderVariant | null>(null);

  protected readonly variant = computed(
    () => this.design() ?? this.branding.header(),
  );
}
