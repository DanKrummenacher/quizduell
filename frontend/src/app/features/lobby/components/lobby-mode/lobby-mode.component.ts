import { Component, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/components/icon';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-lobby-mode',
  templateUrl: './lobby-mode.component.html',
  styleUrl: './lobby-mode.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyModeComponent {
  readonly selectQuickGame = output<void>();
  readonly selectFriendGame = output<void>();
}
