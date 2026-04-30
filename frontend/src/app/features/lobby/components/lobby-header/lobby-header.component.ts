import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/calc-ui-icon';
import '@css-ch/calc-ui-button';

@Component({
  selector: 'app-lobby-header',
  templateUrl: './lobby-header.component.html',
  styleUrl: './lobby-header.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyHeaderComponent {
  readonly playerName = input.required<string>();
  readonly navigateBack = output<void>();
}
