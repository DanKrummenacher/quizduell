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
    expect(result.rematch()).toBe('open');
    expect(result.playAgainText()).toBe('Revanche fordern');
    expect(result.isPlayAgainDisabled()).toBe(false);

    client.state.set(
      finished({ opponent: player('Ben', 0, { rematchRequested: true }) }),
    );
    expect(result.playAgainText()).toBe('Revanche annehmen!');
    expect(result.playAgainStatusText()).toMatch(
      /^Ben möchte eine Revanche! \(noch \d+ s\)$/,
    );

    client.state.set(
      finished({ you: player('Anna', 0, { rematchRequested: true }) }),
    );
    expect(result.playAgainText()).toBe('Anfrage gesendet');
    expect(result.playAgainStatusText()).toMatch(/^Warte auf Ben …/);
    expect(result.isPlayAgainDisabled()).toBe(true);
  });

  it('waits while the opponent reconnects', () => {
    client.state.set(
      finished({
        rematchAvailable: false,
        opponent: player('Ben', 0, { connected: false }),
      }),
    );
    expect(result.rematch()).toBe('paused');
    expect(result.isPlayAgainDisabled()).toBe(true);
    expect(result.playAgainStatusText()).toContain('Verbindung zu Ben unterbrochen');
  });

  it('informs when the opponent left after a rematch request', () => {
    client.state.set(
      finished({
        endReason: 'opponent-left',
        rematchAvailable: false,
        you: player('Anna', 0, { rematchRequested: true }),
      }),
    );
    expect(result.playAgainStatusText()).toBe('Ben hat das Spiel verlassen.');
    expect(result.showNoRematchFlyout()).toBe(true);
    expect(result.playAgainText()).toBe('Neues Spiel erstellen');

    result.handleNoRematchAcknowledge();
    expect(result.showNoRematchFlyout()).toBe(false);
  });

  it('explains a request that was not answered in time', () => {
    client.state.set(
      finished({
        endReason: 'rematch-declined',
        rematchAvailable: false,
        phaseEndsAt: null,
        you: player('Anna', 0, { rematchRequested: true }),
      }),
    );
    expect(result.noRematchText()).toBe('Ben hat nicht rechtzeitig reagiert.');
    expect(result.showNoRematchFlyout()).toBe(true);
  });

  it('offers a rematch in both modes and a new game once it is over', async () => {
    await result.handlePlayAgain();
    expect(client.calls).toEqual(['rematch']);

    client.state.set(finished({ mode: 'quick' }));
    expect(result.playAgainText()).toBe('Revanche fordern');

    client.state.set(
      finished({ mode: 'quick', rematchAvailable: false, phaseEndsAt: null }),
    );
    expect(result.rematch()).toBe('closed');
    expect(result.playAgainText()).toBe('Neuen Gegner suchen');
    await result.handlePlayAgain();
    expect(client.calls).toContain('leave');
  });
});
