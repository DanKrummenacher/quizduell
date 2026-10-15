import { HttpErrorResponse } from '@angular/common/http';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import '@css-ch/calc-ui-text';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import { BrandHeaderComponent } from '../../core/ui/brand-header/brand-header.component';
import { AdminAuthService } from '../admin-auth.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [BrandHeaderComponent, RouterLink],
  template: `
    <div class="page">
      <app-brand-header label="Admin" />

      <main class="main-content">
        <h1 class="main-title">Admin-Bereich</h1>
        <calc-text textLarge class="subtitle">
          Melde dich an, um Fragen und Einstellungen zu verwalten.
        </calc-text>

        @if (expired) {
          <calc-text textMedium class="info-text">
            Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.
          </calc-text>
        }

        <div class="form">
          <css-input-text
            label="Passwort"
            type="password"
            autocomplete="current-password"
            [value]="password()"
            [errorMessage]="error() || undefined"
            (change)="onPasswordChange($event)"
            (keydown)="onKeydown($event)"
          ></css-input-text>
          <css-button stretch variant="primary" [loading]="busy()" (click)="login()">
            <css-icon icon="lock" slot="prefix"></css-icon>
            Anmelden
          </css-button>
          <a class="back-link" routerLink="/">Zurück zum Spiel</a>
        </div>
      </main>
    </div>
  `,
  styles: `
    @use '@css-ch/web-design-tokens/colors';
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;

    :host {
      display: block;
    }
    .page {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      max-width: var(--app-column-width);
      margin: 0 auto;
      padding: var(--app-safe-top) var(--app-safe-right) var(--app-safe-bottom)
        var(--app-safe-left);
    }
    .main-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: functions.rem(40) functions.rem(30);
    }
    .main-title {
      font-size: functions.rem(28);
      font-weight: miscs.$css-ui-font-weight-medium;
      color: colors.$dt-color-darkblue-100;
      margin: 0;
      text-align: center;
    }
    .subtitle {
      line-height: 1.2;
      margin-top: functions.rem(15);
      text-align: center;
    }
    .info-text {
      margin-top: functions.rem(20);
      text-align: center;
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: functions.rem(15);
      width: 100%;
      margin-top: functions.rem(45);
    }
    .back-link {
      align-self: center;
      margin-top: functions.rem(5);
      font-size: functions.rem(16);
      color: colors.$dt-color-darkblue-70;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminLoginPage {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly expired =
    inject(ActivatedRoute).snapshot.queryParamMap.has('abgelaufen');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  constructor() {
    if (this.auth.isLoggedIn()) {
      void this.router.navigate(['/admin']);
    }
  }

  protected onPasswordChange(event: Event): void {
    this.password.set((event as CustomEvent<string>).detail ?? '');
    this.error.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.login();
    }
  }

  protected async login(): Promise<void> {
    if (!this.password()) {
      this.error.set('Bitte gib das Passwort ein.');
      return;
    }
    this.busy.set(true);
    try {
      await this.auth.login(this.password());
      await this.router.navigate(['/admin']);
    } catch (error) {
      this.error.set(loginErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 401:
        return 'Das Passwort ist falsch.';
      case 403:
        return 'Der Admin-Zugang ist auf dem Server nicht eingerichtet.';
      case 429:
        return 'Zu viele Versuche. Bitte warte eine Minute.';
      case 0:
        return 'Der Server ist nicht erreichbar.';
    }
  }
  return 'Die Anmeldung hat nicht geklappt. Bitte versuche es nochmals.';
}
