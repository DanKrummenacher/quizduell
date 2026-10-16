import { Component, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PlayerResultView } from '../../result.types';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-result-players-legacy',
  templateUrl: './result-players-legacy.component.html',
  styleUrl: './result-players-legacy.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResultPlayersLegacyComponent {
  readonly players = input.required<PlayerResultView[]>();
}
