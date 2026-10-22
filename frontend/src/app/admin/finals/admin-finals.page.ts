// The three final admin designs to choose from (development only).
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../admin-auth.service';
import { ProposalPro } from '../proposals/pro';
import { ProposalStore } from '../proposals/proposal-store';
import { AtelierComponent } from './atelier/atelier.component';
import { BuehneComponent } from './buehne/buehne.component';
import { RedaktionComponent } from './redaktion/redaktion.component';

const FINALS = [
  { value: '1', label: 'Atelier', text: 'Profi-Werkzeug für den Desktop' },
  { value: '2', label: 'Bühne', text: 'Touch-Cockpit für den Stand' },
  { value: '3', label: 'Redaktion', text: 'Fragen pflegen wie ein Dokument' },
];

@Component({
  selector: 'app-admin-finals-page',
  imports: [AtelierComponent, BuehneComponent, RedaktionComponent],
  providers: [ProposalStore, ProposalPro],
  template: `
    @switch (v() ?? '1') {
      @case ('3') {
        <app-redaktion (openGame)="openGame()" (logout)="logout()" />
      }
      @case ('2') {
        <app-buehne (openGame)="openGame()" (logout)="logout()" />
      }
      @default {
        <app-atelier (openGame)="openGame()" (logout)="logout()" />
      }
    }

    <details class="switcher">
      <summary>Variante wählen</summary>
      <div class="options">
        @for (option of finals; track option.value) {
          <button
            type="button"
            [class.active]="(v() ?? '1') === option.value"
            (click)="show(option.value)"
          >
            <strong>{{ option.value }} · {{ option.label }}</strong>
            <span>{{ option.text }}</span>
          </button>
        }
        <a class="old" href="/admin/vorschlag">Frühere Vorschläge A–P</a>
      </div>
    </details>
  `,
  styles: `
    .switcher {
      position: fixed;
      left: 50%;
      bottom: calc(var(--app-safe-bottom) + 0.75rem);
      z-index: 100;
      transform: translateX(-50%);
      padding: 0.375rem 0.875rem;
      border-radius: 1rem;
      background: #0f1d36;
      color: #fff;
      font-size: 0.8125rem;
      box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.25);
    }
    summary {
      font-weight: 700;
      cursor: pointer;
      text-align: center;
    }
    .options {
      display: grid;
      gap: 0.25rem;
      min-width: 16rem;
      margin: 0.5rem 0 0.25rem;
    }
    button {
      display: grid;
      gap: 0.125rem;
      padding: 0.5rem 0.625rem;
      border: 0;
      border-radius: 0.5rem;
      background: rgba(255, 255, 255, 0.06);
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    button span {
      opacity: 0.7;
    }
    button.active {
      background: #fff;
      color: #00327d;
    }
    .old {
      padding: 0.375rem 0.625rem;
      color: #8fd3f5;
    }
  `,
})
export class AdminFinalsPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AdminAuthService);

  /** The variant from the address, e.g. `?v=2`. */
  readonly v = input<string>();
  protected readonly finals = FINALS;

  protected show(value: string): void {
    void this.router.navigate([], { queryParams: { v: value } });
  }

  protected openGame(): void {
    void this.router.navigate(['/']);
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/admin/login']);
  }
}
