import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import { BrandingStore, type HeaderVariant } from '../../branding/branding.store';
import { PublicInfoService } from '../../info/public-info.service';
import { LogoMarkComponent } from '../logo-mark/logo-mark.component';

const LIVE_REFRESH_MS = 15_000;

/** App header with logo and wordmark, in the selected design variant. */
@Component({
  selector: 'app-brand-header',
  imports: [LogoMarkComponent],
  templateUrl: './brand-header.component.html',
  styleUrl: './brand-header.component.scss',
  host: { '[class]': "'variant-' + variant()" },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BrandHeaderComponent {
  private readonly branding = inject(BrandingStore);
  protected readonly info = inject(PublicInfoService);

  readonly subtitle = input('Quizduell Challenge');
  /** Overrides the selected variant (used by the design preview). */
  readonly design = input<HeaderVariant | null>(null);

  protected readonly variant = computed(
    () => this.design() ?? this.branding.header(),
  );
  protected readonly showRules = signal(false);
  protected readonly onlineText = computed(() => {
    const online = this.info.info().playersOnline;
    return online > 0 ? `${online} online` : 'Live';
  });
  protected readonly scoringRule = computed(() =>
    this.info.info().speedBonusEnabled
      ? 'Jede richtige Antwort gibt 100 Punkte – wer schneller ist, holt bis zu 100 Bonuspunkte. Wer am Schluss mehr Punkte hat, gewinnt.'
      : 'Jede richtige Antwort gibt 100 Punkte. Wer am Schluss mehr Punkte hat, gewinnt.',
  );

  constructor() {
    // The live counter refreshes itself while it is visible.
    let timer: ReturnType<typeof setInterval> | null = null;
    effect(() => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (this.variant() === 5) {
        void this.info.refresh();
        timer = setInterval(() => void this.info.refresh(), LIVE_REFRESH_MS);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      if (timer) {
        clearInterval(timer);
      }
    });
  }
}
