import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import { ResultPlayersComponent } from '../result-players/result-players.component';
import type { PlayerResultView, RematchCountdownView } from '../../result.types';
import type { ResultNarrowStyle } from '../legacy/design-preview';
import '@css-ch/components/icon';
import '@css-ch/components/button';
import '@css-ch/components/flyout';

@Component({
  selector: 'app-result-ui',
  imports: [BrandHeaderComponent, ResultPlayersComponent],
  templateUrl: './result-ui.component.html',
  styleUrl: './result-ui.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[attr.data-narrow]': 'narrowStyle()' },
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
  // TEMPORARY: message layouts under review.
  readonly rematchShortMessage = input<string | null>(null);
  readonly narrowStyle = input<ResultNarrowStyle>('wrap');
  /** Only while a rematch request is running. */
  readonly rematchCountdown = input<RematchCountdownView | null>(null);
  /** Symbol in front of the rematch message. */
  readonly rematchIcon = input<string | null>(null);
  readonly showNoRematchFlyout = input.required<boolean>();
  readonly noRematchText = input('');

  readonly navigateHome = output<void>();
  readonly playAgain = output<void>();
  readonly noRematchAcknowledge = output<void>();
}
