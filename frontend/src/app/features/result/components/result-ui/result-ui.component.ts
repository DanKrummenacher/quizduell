import {
  afterRenderEffect,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import { ResultPlayersComponent } from '../result-players/result-players.component';
import type { PlayerResultView, RematchCountdownView } from '../../result.types';
import '@css-ch/components/icon';
import '@css-ch/components/button';
import '@css-ch/components/flyout';

@Component({
  selector: 'app-result-ui',
  imports: [BrandHeaderComponent, ResultPlayersComponent],
  templateUrl: './result-ui.component.html',
  styleUrl: './result-ui.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResultUiComponent {
  readonly statusTitle = input.required<string>();
  readonly statusSubtitle = input.required<string>();
  readonly statusIcon = input.required<string>();

  readonly players = input.required<PlayerResultView[]>();
  readonly isPlayAgainDisabled = input.required<boolean>();
  readonly playAgainText = input.required<string>();
  readonly playAgainIcon = input.required<string>();
  /** Explains the rematch state, e.g. «Warte auf Ben …». */
  readonly rematchMessage = input<string | null>(null);
  /** Only while a rematch request is running. */
  readonly rematchCountdown = input<RematchCountdownView | null>(null);
  /** Symbol in front of the rematch message. */
  readonly rematchIcon = input<string | null>(null);
  readonly showNoRematchFlyout = input.required<boolean>();
  readonly noRematchText = input('');

  readonly navigateHome = output<void>();
  readonly playAgain = output<void>();
  readonly noRematchAcknowledge = output<void>();

  private readonly area = viewChild<ElementRef<HTMLElement>>('area');
  private readonly probe = viewChild<ElementRef<HTMLElement>>('probe');

  /**
   * Message and time chip do not fit side by side: the chip moves to the end
   * of the time bar. Measured, so it only happens when space really runs out.
   */
  protected readonly stacked = signal(false);

  constructor() {
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => this.updateStacked());
    inject(DestroyRef).onDestroy(() => observer?.disconnect());

    // Measure again whenever the message, its symbol or the size changes.
    afterRenderEffect(() => {
      this.rematchMessage();
      this.rematchIcon();
      const area = this.area()?.nativeElement;
      if (area && observer) {
        observer.observe(area);
      }
      this.updateStacked();
    });
  }

  private updateStacked(): void {
    const probe = this.probe()?.nativeElement;
    const area = this.area()?.nativeElement;
    this.stacked.set(!!probe && !!area && probe.offsetWidth > area.clientWidth);
  }
}
