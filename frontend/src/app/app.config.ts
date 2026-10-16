import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  type ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { adminAuthInterceptor } from './admin/admin-auth.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error-handler';
import { GameLifecycleService } from './core/game/game-lifecycle.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([adminAuthInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAppInitializer(() => inject(GameLifecycleService).start()),
  ],
};
