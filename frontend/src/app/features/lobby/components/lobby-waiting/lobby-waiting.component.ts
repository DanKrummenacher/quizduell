import { Component, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-lobby-waiting',
  templateUrl: './lobby-waiting.component.html',
  styleUrl: './lobby-waiting.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyWaitingComponent {
  readonly roomCode = input.required<string>();

  copyCode() {
    navigator.clipboard.writeText(this.roomCode()).catch(() => {});
  }
}
