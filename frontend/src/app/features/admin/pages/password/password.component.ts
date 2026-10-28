import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import { AdminApi, messageOf } from '../../core/admin-api.service';
import { AdminSessionService } from '../../core/admin-session.service';
import { NotifyService } from '../../core/notify.service';
import { AdPageHeadComponent } from '../../ui/page-head.component';

/** As required by the server for a new admin password. */
export const PASSWORD_MIN_LENGTH = 12;

type Field = 'current' | 'next' | 'repeat';

/** Changes the one admin password; every other sign-in ends with it. */
@Component({
  selector: 'app-admin-password',
  imports: [AdPageHeadComponent, RouterLink],
  templateUrl: './password.component.html',
  styleUrl: './password.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PasswordComponent {
  private readonly api = inject(AdminApi);
  private readonly session = inject(AdminSessionService);
  private readonly notify = inject(NotifyService);

  protected readonly minLength = PASSWORD_MIN_LENGTH;
  protected readonly current = signal('');
  protected readonly next = signal('');
  protected readonly repeat = signal('');
  protected readonly touched = signal<ReadonlySet<Field>>(new Set());
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly done = signal(false);

  /** What is still wrong with each field, shown once it was touched. */
  protected readonly problems = computed(() => ({
    current: this.current() ? null : 'Bitte das bisherige Passwort eingeben.',
    next: !this.next()
      ? 'Bitte ein neues Passwort wählen.'
      : this.next().length < PASSWORD_MIN_LENGTH
        ? `Mindestens ${PASSWORD_MIN_LENGTH} Zeichen.`
        : this.next() === this.current()
          ? 'Das neue Passwort muss sich vom bisherigen unterscheiden.'
          : null,
    repeat:
      this.repeat() === this.next()
        ? null
        : 'Die Wiederholung stimmt nicht überein.',
  }));

  protected readonly valid = computed(() =>
    Object.values(this.problems()).every((problem) => problem === null),
  );

  protected show(field: Field): string | null {
    return this.submitted() || this.touched().has(field)
      ? this.problems()[field]
      : null;
  }

  protected set(field: Field, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    ({ current: this.current, next: this.next, repeat: this.repeat })[field].set(
      value,
    );
    this.serverError.set(null);
  }

  protected touch(field: Field): void {
    this.touched.update((all) => new Set([...all, field]));
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    if (!this.valid() || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.serverError.set(null);
    try {
      const session = await this.api.changePassword({
        currentPassword: this.current(),
        newPassword: this.next(),
      });
      this.session.replace(session);
      this.done.set(true);
      this.notify.success(
        'Passwort geändert – alle anderen Anmeldungen sind beendet',
      );
    } catch (error) {
      this.serverError.set(messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }
}
