// TEMPORARY: the admin proposals with a switch (development only).
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../admin-auth.service';
import { CockpitComponent } from './cockpit/cockpit.component';
import { ProposalStore } from './proposal-store';
import { StageComponent } from './stage/stage.component';
import { StudioComponent } from './studio/studio.component';

const PROPOSALS = [
  { value: 'a', label: 'A · Cockpit' },
  { value: 'b', label: 'B · Messe-Leitstand' },
  { value: 'c', label: 'C · Fragen-Studio' },
];

@Component({
  selector: 'app-admin-proposals-page',
  imports: [CockpitComponent, StageComponent, StudioComponent],
  providers: [ProposalStore],
  template: `
    @switch (v()) {
      @case ('b') {
        <app-stage (openGame)="openGame()" (logout)="logout()" />
      }
      @case ('c') {
        <app-studio (openGame)="openGame()" (logout)="logout()" />
      }
      @default {
        <app-cockpit (openGame)="openGame()" (logout)="logout()" />
      }
    }

    <details class="panel">
      <summary>Vorschlag</summary>
      <div class="options">
        @for (option of proposals; track option.value) {
          <button
            type="button"
            [class.active]="(v() ?? 'a') === option.value"
            (click)="show(option.value)"
          >
            {{ option.label }}
          </button>
        }
        <button type="button" (click)="today()">Heute</button>
      </div>
    </details>
  `,
  styles: `
    .panel {
      position: fixed;
      right: 0.75rem;
      bottom: calc(var(--app-safe-bottom) + 5.5rem);
      z-index: 30;
      padding: 0.5rem 0.875rem;
      border: 1px solid #00327d;
      border-radius: 0.75rem;
      background: #fff;
      color: #00327d;
      font-size: 0.8125rem;
      box-shadow: 0 0.25rem 0.75rem rgba(0, 50, 125, 0.12);
    }
    summary {
      font-weight: 700;
      cursor: pointer;
    }
    .options {
      display: grid;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }
    button {
      padding: 0.375rem 0.625rem;
      border: 1px solid #dfe8f3;
      border-radius: 0.5rem;
      background: #fff;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    button.active {
      border-color: #00327d;
      font-weight: 700;
    }
  `,
})
export class AdminProposalsPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AdminAuthService);

  /** The proposal from the address, e.g. `?v=b`. */
  readonly v = input<string>();
  protected readonly proposals = PROPOSALS;

  protected show(value: string): void {
    void this.router.navigate([], { queryParams: { v: value } });
  }

  protected today(): void {
    void this.router.navigate(['/admin']);
  }

  protected openGame(): void {
    void this.router.navigate(['/']);
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/admin/login']);
  }
}
