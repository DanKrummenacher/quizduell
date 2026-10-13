import { Component, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PlayerResultView } from '../../result.types';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-result-players',
  templateUrl: './result-players.component.html',
  styleUrl: './result-players.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResultPlayersComponent {
  readonly players = input.required<PlayerResultView[]>();
}
