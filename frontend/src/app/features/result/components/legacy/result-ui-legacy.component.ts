import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import { ResultPlayersLegacyComponent } from './result-players-legacy.component';
import { PlayerResultView } from '../../result.types';
import '@css-ch/calc-ui-text';
import '@css-ch/components/icon';
import '@css-ch/components/button';
import '@css-ch/components/flyout';

@Component({
  selector: 'app-result-ui-legacy',
  imports: [BrandHeaderComponent, ResultPlayersLegacyComponent],
  templateUrl: './result-ui-legacy.component.html',
  styleUrl: './result-ui-legacy.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResultUiLegacyComponent {
  readonly statusTitle = input.required<string>();
  readonly statusSubtitle = input.required<string>();
  readonly statusIcon = input.required<string>();

  readonly players = input.required<PlayerResultView[]>();
  readonly isPlayAgainDisabled = input.required<boolean>();
  readonly playAgainText = input.required<string>();
  readonly playAgainIcon = input.required<string>();
  readonly playAgainStatusText = input<string | null>(null);
  readonly showNoRematchFlyout = input.required<boolean>();
  readonly noRematchText = input('');

  readonly navigateHome = output<void>();
  readonly playAgain = output<void>();
  readonly noRematchAcknowledge = output<void>();
}
