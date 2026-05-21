import { Component, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-icon';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-lobby-mode',
  templateUrl: './lobby-mode.component.html',
  styleUrl: './lobby-mode.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyModeComponent {
  readonly selectFastGame = output<void>();
  readonly selectChallenge = output<void>();
}
