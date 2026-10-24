import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AdminSessionService, LOGIN_PATH } from './admin-session.service';

/** Admin pages need a session; otherwise sign in and come back. */
export const requireAdmin: CanActivateFn = (_, state) =>
  inject(AdminSessionService).signedIn()
    ? true
    : inject(Router).createUrlTree([LOGIN_PATH], {
        queryParams: state.url === '/admin' ? {} : { weiter: state.url },
      });

/** The sign-in page leads straight on when already signed in. */
export const redirectSignedIn: CanActivateFn = (route) =>
  inject(AdminSessionService).signedIn() && !route.queryParamMap.has('vorschau')
    ? inject(Router).createUrlTree(['/admin'])
    : true;
