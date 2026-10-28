import type {
  GameStateView,
  PlayerView,
  RematchStatus,
} from '../contracts/game.contract.js';
import type { Player, Session } from './game.types.js';

/** Builds the personalised snapshot of a session for one player. */
export function buildView(session: Session, player: Player): GameStateView {
  const opponent =
    session.players.find((p) => p.id !== player.id) ??
    session.departed.find((p) => p.id !== player.id) ??
    null;
  const question =
    session.phase === 'question' || session.phase === 'reveal'
      ? session.questions[session.questionIndex]
      : undefined;
  const reveal = session.phase === 'reveal' ? session.lastReveal : null;

  return {
    gameCode: session.code,
    sessionToken: player.sessionToken,
    mode: session.mode,
    phase: session.phase,
    endReason: session.endReason,
    you: toPlayerView(player),
    opponent: opponent ? toPlayerView(opponent) : null,
    questionNumber: questionNumber(session),
    totalQuestions: totalQuestions(session),
    question: question
      ? {
          index: session.questionIndex,
          text: question.text,
          options: question.options,
        }
      : null,
    reveal: reveal
      ? {
          correctIndex: reveal.correctIndex,
          yourAnswerIndex: reveal.answers.get(player.id) ?? null,
          opponentAnswerIndex: opponent
            ? (reveal.answers.get(opponent.id) ?? null)
            : null,
          yourPoints: reveal.points.get(player.id) ?? 0,
          opponentPoints: opponent ? (reveal.points.get(opponent.id) ?? 0) : 0,
        }
      : null,
    phaseEndsAt: session.phaseEndsAt,
    phaseDurationMs:
      session.phaseEndsAt !== null
        ? session.phaseEndsAt - session.phaseStartedAt
        : null,
    serverNow: Date.now(),
    rematch: rematchStatus(session, player),
  };
}

/** The number of the current question, 1-based, never beyond the last. */
export function questionNumber(session: Session): number {
  return Math.min(session.questionIndex + 1, Math.max(session.questions.length, 1));
}

/** How many questions the duel has; the rule until the questions are loaded. */
export function totalQuestions(session: Session): number {
  return session.questions.length || session.settings.questionsPerGame;
}

function toPlayerView(player: Player): PlayerView {
  return {
    name: player.name,
    score: player.score,
    connected: player.socketId !== null,
    hasAnswered: player.answerIndex !== null,
    rematchRequested: player.rematchRequested,
  };
}

function rematchStatus(session: Session, player: Player): RematchStatus | null {
  if (session.phase !== 'finished') {
    return null;
  }
  if (
    session.endReason === 'opponent-left' ||
    session.endReason === 'opponent-disconnected'
  ) {
    return 'opponent-left';
  }
  if (session.phaseEndsAt === null) {
    // The rematch window has closed.
    return player.rematchRequested ? 'unanswered' : 'expired';
  }
  const opponent = session.players.find((p) => p.id !== player.id);
  if (!opponent?.socketId || !player.socketId) {
    return 'paused';
  }
  if (player.rematchRequested) {
    return 'requested';
  }
  return opponent.rematchRequested ? 'offered' : 'open';
}
