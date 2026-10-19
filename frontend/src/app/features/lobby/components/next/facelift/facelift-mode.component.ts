import { Component, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/components/icon';

@Component({
  selector: 'app-facelift-mode',
  templateUrl: './facelift-mode.component.html',
  styleUrl: './facelift-mode.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FaceliftModeComponent {
  readonly selectQuickGame = output<void>();
  readonly selectFriendGame = output<void>();
}
