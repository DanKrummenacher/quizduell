import { inject } from '@angular/core';
import { type CanActivateFn, Router, type Routes } from '@angular/router';
import { PlayerNameStore } from './core/player/player-name.store';
import { StartPage } from './features/start/start.page';

/** The lobby needs a player name; without one, start on the name screen. */
const requireName: CanActivateFn = () =>
  inject(PlayerNameStore).name() ? true : inject(Router).createUrlTree(['/']);

export const routes: Routes = [
  { path: '', component: StartPage, title: 'playduelio – Das Quiz-Duell' },
  {
    path: 'lobby',
    canActivate: [requireName],
    loadComponent: () =>
      import('./features/lobby/lobby.page').then((m) => m.LobbyPage),
    title: 'Spielmodus – playduelio',
  },
  {
    path: 'spiel',
    loadComponent: () => import('./features/game/game.page').then((m) => m.GamePage),
    title: 'Duell – playduelio',
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    title: 'Admin – playduelio',
  },
  { path: '**', redirectTo: '' },
];
