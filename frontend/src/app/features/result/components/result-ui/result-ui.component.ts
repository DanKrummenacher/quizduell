import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ResultPlayersComponent } from '../result-players/result-players.component';
import { PlayerResultView } from '../../result.types';
import '@css-ch/calc-ui-text';
import '@css-ch/calc-ui-icon';
import '@css-ch/calc-ui-button';
import '@css-ch/calc-ui-flyout';

@Component({
  selector: 'app-result-ui',
  imports: [ResultPlayersComponent],
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
  readonly playAgainStatusText = input<string | null>(null);
  readonly showOpponentLeftFlyout = input.required<boolean>();
  readonly showSessionExpiredFlyout = input.required<boolean>();

  readonly navigateHome = output<void>();
  readonly playAgain = output<void>();
  readonly opponentLeftAcknowledge = output<void>();
}
