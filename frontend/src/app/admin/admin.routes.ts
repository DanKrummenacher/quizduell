import { inject } from '@angular/core';
import { type CanActivateFn, Router, type Routes } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

const requireAdmin: CanActivateFn = () =>
  inject(AdminAuthService).isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/admin/login']);

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/admin-login.page').then((m) => m.AdminLoginPage),
    title: 'Admin-Login – playduelio',
  },
  // TEMPORARY: design concepts for the admin (development only).
  {
    path: 'konzepte',
    canActivate: [requireAdmin],
    loadComponent: () =>
      import('./concepts/concepts.page').then((m) => m.ConceptsPage),
    title: 'Konzepte – Admin',
  },
  // TEMPORARY: the final admin designs to choose from (development only).
  {
    path: 'final',
    canActivate: [requireAdmin],
    loadComponent: () =>
      import('./finals/admin-finals.page').then((m) => m.AdminFinalsPage),
    title: 'Admin – playduelio',
  },
  // TEMPORARY: admin proposals under review (development only).
  {
    path: 'vorschlag',
    canActivate: [requireAdmin],
    loadComponent: () =>
      import('./proposals/admin-proposals.page').then((m) => m.AdminProposalsPage),
    title: 'Vorschläge – Admin',
  },
  {
    path: '',
    canActivate: [requireAdmin],
    loadComponent: () =>
      import('./shell/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'uebersicht' },
      {
        path: 'uebersicht',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.page').then(
            (m) => m.AdminDashboardPage,
          ),
        title: 'Übersicht – Admin',
      },
      {
        path: 'fragen',
        loadComponent: () =>
          import('./questions/admin-questions.page').then(
            (m) => m.AdminQuestionsPage,
          ),
        title: 'Fragen – Admin',
      },
      {
        path: 'einstellungen',
        loadComponent: () =>
          import('./settings/admin-settings.page').then((m) => m.AdminSettingsPage),
        title: 'Einstellungen – Admin',
      },
    ],
  },
];
