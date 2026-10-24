import {
  afterNextRender,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import { AdminSessionService } from '../../core/admin-session.service';

const MESSAGES = {
  wrong: 'Das Passwort stimmt nicht.',
  throttled: 'Zu viele Versuche. Bitte eine Minute warten.',
  offline: 'Der Server antwortet nicht. Bitte später erneut versuchen.',
  empty: 'Bitte das Admin-Passwort eingeben.',
};

/**
 * Sign-in with the one admin password, in the design of the quiz's start
 * page: the same brand bar, type, marker and library controls.
 */
@Component({
  selector: 'app-admin-login',
  imports: [BrandHeaderComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginComponent {
  private readonly session = inject(AdminSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly field =
    viewChild<ElementRef<HTMLElement & { value?: string }>>('field');

  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal<string | null>(
    this.session.endReason() === 'expired'
      ? 'Die Anmeldung ist abgelaufen. Bitte erneut anmelden.'
      : this.session.endReason() === 'signed-out'
        ? 'Du bist abgemeldet.'
        : null,
  );

  constructor() {
    afterNextRender(() => this.focusField());
  }

  protected onInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value ?? '');
    this.error.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.submit();
    }
  }

  protected async submit(): Promise<void> {
    if (this.busy()) {
      return;
    }
    if (!this.password()) {
      this.error.set(MESSAGES.empty);
      this.focusField();
      return;
    }
    this.busy.set(true);
    const result = await this.session.login(this.password());
    this.busy.set(false);
    if (result === 'ok') {
      const next = this.route.snapshot.queryParamMap.get('weiter');
      // Only paths inside the admin, never another site.
      const target =
        next?.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
      void this.router.navigateByUrl(target);
      return;
    }
    this.notice.set(null);
    this.error.set(MESSAGES[result]);
    if (result === 'wrong') {
      this.password.set('');
      const host = this.field()?.nativeElement;
      if (host) {
        host.value = '';
      }
    }
    this.focusField();
  }

  private focusField(): void {
    const host = this.field()?.nativeElement;
    const input =
      host?.querySelector('input') ??
      host?.shadowRoot?.querySelector('input') ??
      null;
    input?.focus();
  }
}
