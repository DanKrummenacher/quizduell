import { inject } from '@angular/core';
import type { CanDeactivateFn, Routes } from '@angular/router';
import { ConfirmService } from './core/confirm.service';
import { redirectSignedIn, requireAdmin } from './core/admin.guard';
import type { UnsavedChanges } from './pages/settings/settings.component';
import { AdminRootComponent } from './pages/root/admin-root.component';

const TITLE = 'playduelio Admin';

/** Asks before leaving a page with unsaved changes. */
const keepUnsaved: CanDeactivateFn<UnsavedChanges> = (page) =>
  !page.hasUnsavedChanges() ||
  inject(ConfirmService).ask({
    title: 'Änderungen verwerfen?',
    text: 'Die geänderten Spielregeln sind noch nicht gespeichert.',
    confirm: 'Verwerfen',
    danger: true,
  });

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminRootComponent,
    children: [
      {
        path: 'anmelden',
        canActivate: [redirectSignedIn],
        loadComponent: () =>
          import('./pages/login/login.component').then((m) => m.LoginComponent),
        title: `Anmelden · ${TITLE}`,
      },
      {
        path: '',
        canActivate: [requireAdmin],
        loadComponent: () =>
          import('./pages/shell/admin-shell.component').then(
            (m) => m.AdminShellComponent,
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/overview/overview.component').then(
                (m) => m.OverviewComponent,
              ),
            title: `Übersicht · ${TITLE}`,
          },
          {
            path: 'live',
            loadComponent: () =>
              import('./pages/live/live.component').then((m) => m.LiveComponent),
            title: `Live · ${TITLE}`,
          },
          {
            path: 'fragen',
            loadComponent: () =>
              import('./pages/questions/questions.component').then(
                (m) => m.QuestionsComponent,
              ),
            title: `Fragen · ${TITLE}`,
          },
          {
            path: 'hinweise',
            // Until the hints launch: a page that says what comes.
            loadComponent: () =>
              import('./pages/hints/hints-soon.component').then(
                (m) => m.HintsSoonComponent,
              ),
            title: `Hinweise · ${TITLE}`,
          },
          {
            path: 'auswertung',
            loadComponent: () =>
              import('./pages/analytics/analytics.component').then(
                (m) => m.AnalyticsComponent,
              ),
            title: `Auswertung · ${TITLE}`,
          },
          {
            path: 'regeln',
            canDeactivate: [keepUnsaved],
            loadComponent: () =>
              import('./pages/settings/settings.component').then(
                (m) => m.SettingsComponent,
              ),
            title: `Spielregeln · ${TITLE}`,
          },
          {
            path: 'verlauf',
            loadComponent: () =>
              import('./pages/audit/audit.component').then((m) => m.AuditComponent),
            title: `Verlauf · ${TITLE}`,
          },
          { path: '**', redirectTo: '' },
        ],
      },
    ],
  },
];
