import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GameClient } from '../../../../core/game/game-client.service';
import { PlayerNameStore } from '../../../../core/player/player-name.store';
import { FakeGameClient, gameState } from '../../../../testing/fake-game-client';
import { LobbyContainerComponent } from './lobby-container.component';

describe('LobbyContainerComponent', () => {
  let client: FakeGameClient;
  let lobby: LobbyContainerComponent;

  beforeEach(() => {
    client = new FakeGameClient();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: GameClient, useValue: client },
      ],
    });
    TestBed.inject(PlayerNameStore).set('Anna');
    lobby = TestBed.createComponent(LobbyContainerComponent).componentInstance;
  });

  it('starts with the game mode choice', () => {
    expect(lobby.lobbyState()).toBe('CHOOSE_MODE');
    lobby.handleSelectFriendGame();
    expect(lobby.lobbyState()).toBe('CHOOSE_ACTION');
    lobby.handleBack();
    expect(lobby.lobbyState()).toBe('CHOOSE_MODE');
  });

  it('follows the game: searching, waiting and match found', () => {
    client.searching.set(true);
    expect(lobby.lobbyState()).toBe('SEARCHING');

    client.searching.set(false);
    client.state.set(gameState({ phase: 'waiting', opponent: null }));
    expect(lobby.lobbyState()).toBe('WAITING');
    expect(lobby.roomCode()).toBe('K7QX');

    client.state.set(gameState({ phase: 'countdown', phaseDurationMs: 3000 }));
    expect(lobby.lobbyState()).toBe('FOUND');
    expect(lobby.opponentName()).toBe('Ben');
  });

  it('leaves a waiting game when going back', () => {
    client.state.set(gameState({ phase: 'waiting', opponent: null }));
    lobby.handleBack();
    expect(client.calls).toContain('leave');
    expect(lobby.lobbyState()).toBe('CHOOSE_ACTION');
  });

  it('shows join errors on the code field', async () => {
    client.joinGame = () =>
      Promise.resolve({ ok: false, error: 'GAME_NOT_FOUND' as const });
    await lobby.handleJoin('ZZZZ');
    expect(lobby.joinError()).toBe('Zu diesem Code gibt es kein offenes Spiel.');
  });
});
