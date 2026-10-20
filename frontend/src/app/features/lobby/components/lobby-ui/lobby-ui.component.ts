import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import { LobbyState } from '../../lobby.types';
import { LobbyHeaderComponent } from '../lobby-header/lobby-header.component';
import { LobbyActionsComponent } from '../lobby-actions/lobby-actions.component';
import { LobbyWaitingComponent } from '../lobby-waiting/lobby-waiting.component';
import { LobbyMatchFoundComponent } from '../lobby-match-found/lobby-match-found.component';
import { LobbyModeComponent } from '../lobby-mode/lobby-mode.component';
import { LobbySearchingComponent } from '../lobby-searching/lobby-searching.component';
import { FaceliftModeComponent } from '../next/facelift/facelift-mode.component';
import { FaceliftActionsComponent } from '../next/facelift/facelift-actions.component';
import { FaceliftSearchingComponent } from '../next/facelift/facelift-searching.component';
import { FaceliftWaitingComponent } from '../next/facelift/facelift-waiting.component';
import { FaceliftMatchFoundComponent } from '../next/facelift/facelift-match-found.component';
import {
  FULLSCREEN_MATCH,
  type LobbyDesign,
  type MatchLayout,
} from '../next/lobby-design';
import '@css-ch/components/button';
import '@css-ch/components/flyout';

@Component({
  selector: 'app-lobby-ui',
  imports: [
    BrandHeaderComponent,
    LobbyHeaderComponent,
    LobbyModeComponent,
    LobbyActionsComponent,
    LobbyWaitingComponent,
    LobbySearchingComponent,
    LobbyMatchFoundComponent,
    FaceliftModeComponent,
    FaceliftActionsComponent,
    FaceliftSearchingComponent,
    FaceliftWaitingComponent,
    FaceliftMatchFoundComponent,
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
  // TEMPORARY: lobby designs under review.
  readonly design = input<LobbyDesign>('today');
  readonly matchLayout = input<MatchLayout>('facelift');

  /** TEMPORARY: some match proposals use the whole screen. */
  protected readonly fullscreen = computed(
    () => this.state() === 'FOUND' && FULLSCREEN_MATCH.includes(this.matchLayout()),
  );

  /** Greeting and back navigation, hidden while the duel is about to start. */
  protected readonly hasNavigation = computed(
    () =>
      this.state() !== 'FOUND' ||
      // TEMPORARY: proposal that keeps the greeting when the opponent is found.
      this.matchLayout() === 'f-header',
  );

  readonly navigateBack = output<void>();
  readonly selectQuickGame = output<void>();
  readonly selectFriendGame = output<void>();
  readonly createGame = output<void>();
  readonly joinGame = output<string>();
  readonly cancelSearch = output<void>();
  readonly acknowledgeOpponentLeft = output<void>();
  readonly acknowledgeNotice = output<void>();
}
