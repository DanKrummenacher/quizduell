import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/components/icon';
import '@css-ch/components/button';

@Component({
  selector: 'app-lobby-header',
  templateUrl: './lobby-header.component.html',
  styleUrl: './lobby-header.component.scss',
  host: { '[class.is-modern]': 'modern()' },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyHeaderComponent {
  readonly playerName = input.required<string>();
  // TEMPORARY: typography of the facelift.
  readonly modern = input(false);
  /** Hidden but still taking its space, so the greeting does not move. */
  readonly canGoBack = input(true);
  readonly navigateBack = output<void>();
}
