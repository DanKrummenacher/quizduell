import { HttpErrorResponse } from '@angular/common/http';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import '@css-ch/components/notification';
import { PageComponent } from '../../core/ui/page/page.component';
import { AdminAuthService } from '../admin-auth.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [PageComponent],
  template: `
    <app-page [centered]="true">
      <h1 class="title">Admin-Bereich</h1>
      <p class="lead">Melde dich an, um Fragen und Einstellungen zu verwalten.</p>

      @if (expired) {
        <css-notification
          class="notice"
          variant="info"
          size="sm"
          title="Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."
        />
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
        />
        <css-button variant="primary" stretch [loading]="busy()" (click)="login()">
          <css-icon slot="prefix" icon="lock" />
          Anmelden
        </css-button>
      </div>
    </app-page>
  `,
  styles: `
    .title {
      font-size: clamp(1.5rem, 5vw, 2rem);
      font-weight: var(--css-font-weight-bold);
    }
    .lead {
      margin-top: var(--css-space-2xs);
      font: var(--css-textstyle-body-md);
      color: var(--css-color-text-strong);
    }
    .notice {
      display: block;
      margin-top: var(--css-space-sm);
    }
    .form {
      display: grid;
      gap: var(--css-space-xs);
      margin-top: var(--css-space-md);
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
