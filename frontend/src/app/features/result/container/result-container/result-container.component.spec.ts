import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GameClient } from '../../../../core/game/game-client.service';
import {
  FakeGameClient,
  gameState,
  player,
} from '../../../../testing/fake-game-client';
import { ResultContainerComponent } from './result-container.component';

describe('ResultContainerComponent', () => {
  let client: FakeGameClient;
  let result: ResultContainerComponent;

  const finished = (overrides = {}) =>
    gameState({
      phase: 'finished',
      question: null,
      rematchAvailable: true,
      ...overrides,
    });

  beforeEach(() => {
    client = new FakeGameClient();
    client.state.set(
      finished({ you: player('Anna', 520), opponent: player('Ben', 300) }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: GameClient, useValue: client },
      ],
    });
    result = TestBed.createComponent(ResultContainerComponent).componentInstance;
  });

  it('shows a win with the winner first', () => {
    expect(result.statusTitle()).toBe('Gewonnen!');
    expect(result.statusIcon()).toBe('trophy');
    expect(result.playersView()[0]).toEqual({
      name: 'Anna',
      score: 520,
      cardState: 'win',
      isMe: true,
    });
  });

  it('shows a loss and a draw', () => {
    client.state.set(
      finished({ you: player('Anna', 100), opponent: player('Ben', 300) }),
    );
    expect(result.statusTitle()).toBe('Verloren!');
    client.state.set(
      finished({ you: player('Anna', 300), opponent: player('Ben', 300) }),
    );
    expect(result.statusTitle()).toBe('Unentschieden!');
  });

  it('walks through the rematch states', () => {
    expect(result.playAgainText()).toBe('Erneut Spielen');
    expect(result.isPlayAgainDisabled()).toBe(false);

    client.state.set(
      finished({ opponent: player('Ben', 0, { rematchRequested: true }) }),
    );
    expect(result.playAgainText()).toBe('Revanche annehmen!');
    expect(result.playAgainStatusText()).toBe('Dein Gegner möchte eine Revanche.');

    client.state.set(
      finished({ you: player('Anna', 0, { rematchRequested: true }) }),
    );
    expect(result.playAgainText()).toBe('Anfrage gesendet');
    expect(result.isPlayAgainDisabled()).toBe(true);
  });

  it('informs when the opponent left after a rematch request', () => {
    client.state.set(
      finished({
        endReason: 'opponent-left',
        rematchAvailable: false,
        you: player('Anna', 0, { rematchRequested: true }),
      }),
    );
    expect(result.playAgainStatusText()).toBe(
      'Dein Gegner hat das Spiel verlassen!',
    );
    expect(result.showOpponentLeftFlyout()).toBe(true);
  });

  it('requests a rematch in friend games and requeues in quick games', async () => {
    await result.handlePlayAgain();
    expect(client.calls).toEqual(['rematch']);

    client.state.set(finished({ mode: 'quick' }));
    expect(result.playAgainStatusText()).toBeNull();
    await result.handlePlayAgain();
    expect(client.calls).toContain('leave');
  });
});
