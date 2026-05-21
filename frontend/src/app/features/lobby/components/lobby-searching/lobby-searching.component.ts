import { Component, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-icon';
import '@css-ch/calc-ui-text';
import '@css-ch/calc-ui-button';

@Component({
  selector: 'app-lobby-searching',
  templateUrl: './lobby-searching.component.html',
  styleUrl: './lobby-searching.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbySearchingComponent {
  readonly cancelSearch = output<void>();
}
