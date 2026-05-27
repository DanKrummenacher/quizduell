import { Component, input, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-lobby-waiting',
  templateUrl: './lobby-waiting.component.html',
  styleUrl: './lobby-waiting.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyWaitingComponent {
  readonly roomCode = input.required<string>();

  readonly isCopied = signal<boolean>(false);

  copyCode() {
    navigator.clipboard
      .writeText(this.roomCode())
      .then(() => {
        this.isCopied.set(true);
        setTimeout(() => {
          this.isCopied.set(false);
        }, 1000);
      })
      .catch((error) => {
        console.warn('Code konnte nicht kopiert werden', error);
      });
  }
}
