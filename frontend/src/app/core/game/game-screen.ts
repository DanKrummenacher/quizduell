import type {
  ActivatedRouteSnapshot,
  NavigationExtras,
  Route,
} from '@angular/router';
import type { GameMode } from '../contracts/game.contract';

/**
 * Route data marking a game screen (lobby, quiz, result). A running game or
 * search continues only while one of these screens is shown.
 */
export const GAME_SCREEN_DATA: Route['data'] = { gameScreen: true };

/**
 * Game screens replace each other in the browser history, so the whole duel
 * is a single entry: "back" leaves the game instead of bouncing between them.
 */
export const GAME_SCREEN_NAVIGATION: NavigationExtras = { replaceUrl: true };

/** Whether the deepest active route of `root` is a game screen. */
export function isGameScreen(root: ActivatedRouteSnapshot): boolean {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.data['gameScreen'] === true;
}

/** Navigation state asking the lobby to start a new game of this mode at once. */
export interface LobbyStartState {
  autoStart?: GameMode;
}
