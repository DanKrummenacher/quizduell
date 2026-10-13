import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  GameStateView,
  PlayerView,
} from '../../../core/contracts/game.contract';
import { gameState } from '../../../testing/game-state';
import { GameResultComponent } from './game-result.component';

const player = (
  name: string,
  score: number,
  extra: Partial<PlayerView> = {},
): PlayerView => ({
  name,
  score,
  connected: true,
  hasAnswered: false,
  rematchRequested: false,
  ...extra,
});

describe('GameResultComponent', () => {
  let fixture: ComponentFixture<GameResultComponent>;
  let element: HTMLElement;

  async function render(overrides: Partial<GameStateView>) {
    fixture.componentRef.setInput(
      'state',
      gameState({
        phase: 'finished',
        question: null,
        rematchAvailable: true,
        phaseEndsAt: 30_000,
        ...overrides,
      }),
    );
    fixture.componentRef.setInput('remainingMs', 30_000);
    await fixture.whenStable();
  }

  const text = () => element.textContent?.replace(/\s+/g, ' ') ?? '';

  beforeEach(() => {
    fixture = TestBed.createComponent(GameResultComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  it('celebrates a win and ranks the winner first', async () => {
    await render({ you: player('Anna', 520), opponent: player('Ben', 300) });
    expect(element.querySelector('h1')?.textContent).toBe('Gewonnen!');
    const names = Array.from(element.querySelectorAll('.row .name')).map((n) =>
      n.textContent?.trim(),
    );
    expect(names[0]).toContain('Anna');
  });

  it('shows a loss and a draw', async () => {
    await render({ you: player('Anna', 100), opponent: player('Ben', 300) });
    expect(element.querySelector('h1')?.textContent).toBe('Knapp daneben');
    await render({ you: player('Anna', 300), opponent: player('Ben', 300) });
    expect(element.querySelector('h1')?.textContent).toBe('Unentschieden');
  });

  it('offers to accept a rematch the opponent asked for', async () => {
    await render({
      you: player('Anna', 100),
      opponent: player('Ben', 300, { rematchRequested: true }),
    });
    expect(text()).toContain('Revanche annehmen');
    expect(text()).toContain('Ben will eine Revanche!');
  });

  it('waits after asking for a rematch', async () => {
    await render({
      you: player('Anna', 100, { rematchRequested: true }),
      opponent: player('Ben', 300),
    });
    expect(text()).toContain('Warte auf Ben …');
  });

  it('explains when the opponent has left', async () => {
    await render({
      endReason: 'opponent-left',
      rematchAvailable: false,
      you: player('Anna', 100),
      opponent: player('Ben', 300, { connected: false }),
    });
    expect(text()).toContain('Ben hat das Spiel verlassen.');
  });

  it('offers a new quick duel instead of a rematch in quick games', async () => {
    await render({ mode: 'quick', rematchAvailable: false });
    expect(text()).toContain('Neues Duell');
    expect(text()).not.toContain('Revanche');
  });
});
