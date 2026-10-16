import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminAuthService } from './admin-auth.service';

const ADMIN_API = `${environment.apiUrl}/api/admin/`;
const LOGIN_URL = `${ADMIN_API}auth/login`;

/** Adds the admin token to admin API calls and handles expired sessions. */
export const adminAuthInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(ADMIN_API) || request.url === LOGIN_URL) {
    return next(request);
  }

  const auth = inject(AdminAuthService);
  const router = inject(Router);
  const token = auth.token();
  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.forgetSession();
        void router.navigate(['/admin/login'], { queryParams: { abgelaufen: 1 } });
      }
      return throwError(() => error);
    }),
  );
};
