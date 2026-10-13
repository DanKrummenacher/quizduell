import { inject } from '@angular/core';
import { type CanActivateFn, Router, type Routes } from '@angular/router';
import { PlayerNameStore } from './core/player/player-name.store';
import { StartContainerComponent } from './features/start/container/start-container/start-container.component';

const TITLE = 'Quizduell Challenge';

/** The lobby needs a player name; without one, start on the name screen. */
const requireName: CanActivateFn = () =>
  inject(PlayerNameStore).name() ? true : inject(Router).createUrlTree(['/']);

export const routes: Routes = [
  { path: '', component: StartContainerComponent, title: TITLE },
  {
    path: 'lobby',
    canActivate: [requireName],
    loadComponent: () =>
      import('./features/lobby/container/lobby-container/lobby-container.component').then(
        (m) => m.LobbyContainerComponent,
      ),
    title: TITLE,
  },
  {
    path: 'quiz',
    loadComponent: () =>
      import('./features/quiz/container/quiz-container/quiz-container.component').then(
        (m) => m.QuizContainerComponent,
      ),
    title: TITLE,
  },
  {
    path: 'result',
    loadComponent: () =>
      import('./features/result/container/result-container/result-container.component').then(
        (m) => m.ResultContainerComponent,
      ),
    title: TITLE,
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    title: 'Admin – playduelio',
  },
  { path: '**', redirectTo: '' },
];
