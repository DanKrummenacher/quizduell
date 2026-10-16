import { TestBed } from '@angular/core/testing';
import type { GameStateView } from '../../../../core/contracts/game.contract';
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

  const finished = (overrides: Partial<GameStateView> = {}) =>
    gameState({
      phase: 'finished',
      question: null,
      rematch: 'open',
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
    expect(result.playAgainButton()).toEqual({
      label: 'Revanche fordern',
      icon: 'undo',
      disabled: false,
    });
    expect(result.playAgainHint()).toBeNull();

    client.state.set(finished({ rematch: 'offered' }));
    expect(result.playAgainButton().label).toBe('Revanche annehmen!');
    expect(result.playAgainHint()).toBe('Ben möchte eine Revanche! (noch 20 s)');

    client.state.set(finished({ rematch: 'requested' }));
    expect(result.playAgainButton()).toMatchObject({
      label: 'Anfrage gesendet',
      disabled: true,
    });
    expect(result.playAgainHint()).toBe('Warte auf Ben … (noch 20 s)');
  });

  it('waits while a connection is interrupted', () => {
    client.state.set(finished({ rematch: 'paused' }));
    expect(result.playAgainButton().disabled).toBe(true);
    expect(result.playAgainHint()).toContain('Verbindung zu Ben unterbrochen');
  });

  it('informs when the opponent left after a rematch request', () => {
    client.state.set(
      finished({
        rematch: 'opponent-left',
        you: player('Anna', 0, { rematchRequested: true }),
      }),
    );
    expect(result.playAgainHint()).toBe('Ben hat das Spiel verlassen.');
    expect(result.showNoRematchNotice()).toBe(true);
    expect(result.playAgainButton().label).toBe('Neues Spiel erstellen');

    result.handleNoRematchAcknowledge();
    expect(result.showNoRematchNotice()).toBe(false);
  });

  it('explains a request that was not answered in time', () => {
    client.state.set(finished({ rematch: 'unanswered', phaseEndsAt: null }));
    expect(result.playAgainHint()).toBe('Ben hat nicht rechtzeitig reagiert.');
    expect(result.showNoRematchNotice()).toBe(true);
  });

  it('offers a rematch in both modes and a new game once it is over', async () => {
    await result.handlePlayAgain();
    expect(client.calls).toEqual(['rematch']);

    client.state.set(finished({ mode: 'quick' }));
    expect(result.playAgainButton().label).toBe('Revanche fordern');

    client.state.set(
      finished({ mode: 'quick', rematch: 'expired', phaseEndsAt: null }),
    );
    expect(result.showNoRematchNotice()).toBe(false);
    expect(result.playAgainButton().label).toBe('Neuen Gegner suchen');
    await result.handlePlayAgain();
    expect(client.calls).toContain('leave');
  });
});
