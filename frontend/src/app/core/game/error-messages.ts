import type { ErrorCode } from '../contracts/game.contract';

export type ClientErrorCode = ErrorCode | 'CONNECTION_FAILED' | 'TIMEOUT';

const MESSAGES: Record<ClientErrorCode, string> = {
  INVALID_INPUT: 'Bitte überprüfe deine Eingabe.',
  NAME_REJECTED: 'Dieser Name ist nicht erlaubt. Bitte wähle einen anderen.',
  GAME_NOT_FOUND: 'Zu diesem Code gibt es kein offenes Spiel.',
  GAME_FULL: 'Dieses Spiel hat bereits begonnen.',
  OWN_GAME: 'Das ist dein eigenes Spiel. Teile den Code mit deinem Gegner.',
  ALREADY_IN_GAME: 'Du bist bereits in einem Spiel.',
  NOT_IN_GAME: 'Du bist in keinem Spiel.',
  NOT_ENOUGH_QUESTIONS:
    'Im Moment sind nicht genügend Fragen verfügbar. Bitte versuche es später.',
  ANSWER_REJECTED: 'Deine Antwort kam leider zu spät.',
  REMATCH_UNAVAILABLE: 'Eine Revanche ist nicht mehr möglich.',
  SESSION_NOT_FOUND: 'Das Spiel ist leider nicht mehr verfügbar.',
  RATE_LIMITED: 'Langsam! Bitte warte einen Moment.',
  SERVER_ERROR: 'Ups, da ist etwas schiefgelaufen. Bitte versuche es nochmals.',
  CONNECTION_FAILED: 'Keine Verbindung zum Server. Prüfe deine Internetverbindung.',
  TIMEOUT: 'Der Server antwortet nicht. Bitte versuche es nochmals.',
};

export function errorMessage(code: ClientErrorCode): string {
  return MESSAGES[code];
}
