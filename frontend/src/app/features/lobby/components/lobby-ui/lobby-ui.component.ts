import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { LobbyState } from '../../lobby.types';
import { LobbyHeaderComponent } from '../lobby-header/lobby-header.component';
import { LobbyActionsComponent } from '../lobby-actions/lobby-actions.component';
import { LobbyWaitingComponent } from '../lobby-waiting/lobby-waiting.component';
import { LobbyMatchFoundComponent } from '../lobby-match-found/lobby-match-found.component';
import { LobbyModeComponent } from '../lobby-mode/lobby-mode.component';
import { LobbySearchingComponent } from '../lobby-searching/lobby-searching.component';
import '@css-ch/components/button';
import '@css-ch/components/flyout';

@Component({
  selector: 'app-lobby-ui',
  imports: [
    LobbyHeaderComponent,
    LobbyModeComponent,
    LobbyActionsComponent,
    LobbyWaitingComponent,
    LobbySearchingComponent,
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
  readonly opponentLeft = input<boolean>(false);
  readonly countdownMs = input<number>(3000);
  readonly notice = input<string | null>(null);

  readonly navigateBack = output<void>();
  readonly selectQuickGame = output<void>();
  readonly selectFriendGame = output<void>();
  readonly createGame = output<void>();
  readonly joinGame = output<string>();
  readonly cancelSearch = output<void>();
  readonly acknowledgeOpponentLeft = output<void>();
  readonly acknowledgeNotice = output<void>();
}
