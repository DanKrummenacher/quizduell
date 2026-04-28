import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { LobbyState } from '../../lobby.types';
import { LobbyHeaderComponent } from '../lobby-header/lobby-header.component';
import { LobbyActionsComponent } from '../lobby-actions/lobby-actions.component';
import { LobbyWaitingComponent } from '../lobby-waiting/lobby-waiting.component';
import { LobbyMatchFoundComponent } from '../lobby-match-found/lobby-match-found.component';

@Component({
  selector: 'app-lobby-ui',
  imports: [
    LobbyHeaderComponent,
    LobbyActionsComponent,
    LobbyWaitingComponent,
    LobbyMatchFoundComponent,
  ],
  templateUrl: './lobby-ui.component.html',
  styleUrl: './lobby-ui.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyUiComponent {
  readonly state = input.required<LobbyState>();
  readonly playerName = input.required<string>();
  readonly roomCode = input.required<string>();
  readonly opponentName = input.required<string>();
  readonly joinError = input<string>('');

  readonly navigateBack = output<void>();
  readonly createGame = output<void>();
  readonly joinGame = output<string>();
}
