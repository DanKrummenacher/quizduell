import type { GameStateView } from '../core/contracts/game.contract';

/** Builds a game snapshot for component tests. */
export function gameState(overrides: Partial<GameStateView> = {}): GameStateView {
  return {
    gameCode: 'K7QX',
    sessionToken: 'token',
    mode: 'friend',
    phase: 'question',
    endReason: null,
    you: {
      name: 'Anna',
      score: 0,
      connected: true,
      hasAnswered: false,
      rematchRequested: false,
    },
    opponent: {
      name: 'Ben',
      score: 0,
      connected: true,
      hasAnswered: false,
      rematchRequested: false,
    },
    questionNumber: 1,
    totalQuestions: 7,
    question: {
      index: 0,
      text: 'Wie viele Kantone hat die Schweiz?',
      options: ['23', '24', '26', '28'],
    },
    reveal: null,
    phaseEndsAt: 20_000,
    phaseDurationMs: 20_000,
    serverNow: 0,
    rematchAvailable: false,
    ...overrides,
  };
}
