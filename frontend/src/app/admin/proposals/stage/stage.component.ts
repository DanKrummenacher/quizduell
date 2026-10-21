// TEMPORARY: proposal B «Messe-Leitstand» (development only).
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import '@css-ch/components/notification';
import { BrandHeaderComponent } from '../../../core/ui/brand-header/brand-header.component';
import { ProposalStore } from '../proposal-store';
import { StageLiveComponent } from './stage-live.component';
import { StageQuestionsComponent } from './stage-questions.component';
import { StageRulesComponent } from './stage-rules.component';

export type StageView = 'live' | 'questions' | 'rules';

/**
 * The admin as a part of the game: the same header, column, cards and
 * symbols as the players see, made for a tablet at the fair stand. Big
 * touch targets, the live state first, rules as presets.
 */
@Component({
  selector: 'app-stage',
  imports: [
    BrandHeaderComponent,
    StageLiveComponent,
    StageQuestionsComponent,
    StageRulesComponent,
  ],
  template: `
    <app-brand-header label="Admin" />

    <nav class="segments" aria-label="Admin-Navigation">
      @for (item of nav; track item.key) {
        <button
          type="button"
          class="segment"
          [class.active]="view() === item.key"
          [attr.aria-current]="view() === item.key ? 'page' : null"
          (click)="go(item.key)"
        >
          <css-icon [icon]="item.icon" size="sm"></css-icon>
          {{ item.label }}
        </button>
      }
    </nav>

    <main class="main">
      @switch (view()) {
        @case ('live') {
          <app-stage-live
            (navigate)="go($event)"
            (openGame)="openGame.emit()"
            (logout)="logout.emit()"
          />
        }
        @case ('questions') {
          <app-stage-questions />
        }
        @case ('rules') {
          <app-stage-rules />
        }
      }
    </main>

    @if (store.message(); as m) {
      <css-notification
        class="toast"
        size="sm"
        [variant]="m.variant"
        [title]="m.text"
        ariaLabelCloseButton="Schliessen"
        (close)="store.message.set(null)"
      ></css-notification>
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';

    :host {
      display: block;
      width: 100%;
      max-width: functions.rem(760);
      min-height: 100dvh;
      margin: 0 auto;
      padding: var(--app-safe-top) var(--app-safe-right) var(--app-safe-bottom)
        var(--app-safe-left);
      background-color: kit.$page;

      @media (min-width: 1024px) {
        box-shadow: 0 0 3rem 2rem kit.$page;
      }
    }

    // A segmented control as the toggle groups of the library.
    .segments {
      position: sticky;
      top: 0;
      z-index: 6;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: functions.rem(4);
      margin: functions.rem(16) functions.rem(16) 0;
      padding: functions.rem(4);
      border: functions.rem(1) solid kit.$border;
      border-radius: functions.rem(4);
      background-color: kit.$white;
    }

    .segment {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: functions.rem(8);
      min-height: functions.rem(44);
      border: 0;
      border-radius: functions.rem(2);
      background: none;
      color: kit.$blue;
      font: inherit;
      font-size: functions.rem(15);
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        color 0.2s ease;

      &.active {
        background-color: kit.$blue;
        color: kit.$white;
        font-weight: miscs.$css-ui-font-weight-bold;
      }

      @media (max-width: 380px) {
        css-icon {
          display: none;
        }
      }
    }

    .main {
      padding: functions.rem(32) functions.rem(16) functions.rem(48);
    }

    .toast {
      @include kit.toast;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StageComponent {
  protected readonly store = inject(ProposalStore);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly view = signal<StageView>('live');
  protected readonly nav = [
    { key: 'live' as const, label: 'Live', icon: 'statistic' },
    { key: 'questions' as const, label: 'Fragen', icon: 'items-list' },
    { key: 'rules' as const, label: 'Regeln', icon: 'settings' },
  ];

  protected go(view: StageView): void {
    this.view.set(view);
    window.scrollTo({ top: 0 });
  }
}
