import type { NavigationExtras } from '@angular/router';

/**
 * Lobby, quiz and result replace each other in the browser history, so the
 * whole duel is a single entry: "back" leaves the game instead of bouncing
 * between game screens.
 */
export const GAME_SCREEN: NavigationExtras = { replaceUrl: true };
