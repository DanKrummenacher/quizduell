import type { Logger } from '@nestjs/common';
import type { Session } from './game.types.js';

/** Runs the callback after the delay as the one timer of the session. */
export function setSessionTimer(
  session: Session,
  delayMs: number,
  callback: () => void,
  logger: Logger,
): void {
  clearSessionTimer(session);
  session.timer = setTimeout(() => {
    session.timer = null;
    try {
      callback();
    } catch (error) {
      logger.error(`Timer failed in game ${session.code}: ${String(error)}`);
    }
  }, delayMs);
}

export function clearSessionTimer(session: Session): void {
  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }
}

/** Stops the session timer and every pending disconnect of its players. */
export function clearAllTimers(session: Session): void {
  clearSessionTimer(session);
  for (const player of session.players) {
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
  }
}
