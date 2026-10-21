// TEMPORARY: proposal L «Klassik» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import { BrandHeaderComponent } from '../../../core/ui/brand-header/brand-header.component';
import { ProposalPro } from '../pro';
import { ProposalStore } from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';
import { ClassicDetailComponent } from './classic-detail.component';
import { ClassicOverviewComponent } from './classic-overview.component';
import { ClassicQuestionsComponent } from './classic-questions.component';
import { ClassicSettingsComponent } from './classic-settings.component';
import { ClassicState } from './classic-state';

/**
 * The proven pattern of large admin systems: the brand header of the game,
 * main tabs below it, lists with tabs and pages, every question on its own
 * page with sections and a side column, and a save bar that appears over
 * the header as soon as something changed.
 */
@Component({
  selector: 'app-classic',
  imports: [
    BrandHeaderComponent,
    ProposalDialogsComponent,
    ClassicOverviewComponent,
    ClassicQuestionsComponent,
    ClassicDetailComponent,
    ClassicSettingsComponent,
  ],
  providers: [ClassicState],
  template: `
    <app-brand-header label="Admin" align="start" />

    <nav class="tabs" aria-label="Admin-Navigation">
      <div class="tabs-inner">
        @for (item of items; track item.name) {
          <button
            type="button"
            class="tab"
            [class.active]="section() === item.name"
            [attr.aria-current]="section() === item.name ? 'page' : null"
            (click)="state.go({ name: item.name })"
          >
            {{ item.label }}
            @if (item.name === 'questions') {
              <span class="count">{{ store.counts().total }}</span>
            }
          </button>
        }
        <span class="spacer"></span>
        @if (store.stats(); as s) {
          <span class="live" [class.warning]="store.ready() === false">
            <span class="dot"></span>{{ s.playersOnline }} Geräte ·
            {{ s.activeGames }} Duelle
          </span>
        }
        <button
          type="button"
          class="tab icon"
          title="Zum Spiel"
          aria-label="Zum Spiel"
          (click)="openGame.emit()"
        >
          <css-icon icon="home" size="sm"></css-icon>
        </button>
        <button
          type="button"
          class="tab icon"
          title="Abmelden"
          aria-label="Abmelden"
          (click)="logout.emit()"
        >
          <css-icon icon="logout" size="sm"></css-icon>
        </button>
      </div>
    </nav>

    <main class="main">
      @switch (state.page().name) {
        @case ('overview') {
          <app-classic-overview />
        }
        @case ('questions') {
          <app-classic-questions />
        }
        @case ('question') {
          <app-classic-detail />
        }
        @case ('settings') {
          <app-classic-settings />
        }
      }
    </main>

    <app-proposal-dialogs [editor]="false" />
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'interaction';
    @use '../kit';

    :host {
      display: block;
      min-height: 100dvh;
      padding: var(--app-safe-top) 0 var(--app-safe-bottom);
      background-color: #f4f6f9;
      --brand-inner-width: #{functions.rem(1200)};
      --brand-inner-padding: #{functions.rem(16)};
    }

    .tabs {
      border-bottom: functions.rem(1) solid #dfe5ee;
      background-color: kit.$white;
    }

    .tabs-inner {
      display: flex;
      align-items: center;
      gap: functions.rem(4);
      max-width: functions.rem(1200);
      margin: 0 auto;
      padding: 0 functions.rem(8);
      overflow-x: auto;
      scrollbar-width: none;
    }

    .tab {
      display: inline-flex;
      flex: none;
      align-items: center;
      gap: functions.rem(6);
      height: functions.rem(52);
      padding: 0 functions.rem(12);
      border: 0;
      border-bottom: functions.rem(3) solid transparent;
      background: none;
      font: inherit;
      font-size: functions.rem(15);
      color: kit.$muted;
      cursor: pointer;

      &.active {
        border-bottom-color: kit.$blue;
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
      }

      &.icon {
        padding: 0 functions.rem(10);
      }

      @media (hover: hover) {
        &:hover {
          color: kit.$blue;
        }
      }
    }

    .count {
      padding: 0 functions.rem(6);
      border-radius: functions.rem(8);
      background-color: kit.$fill;
      font-size: functions.rem(12);
      color: kit.$blue;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .live {
      display: inline-flex;
      flex: none;
      align-items: center;
      gap: functions.rem(8);
      margin-right: functions.rem(8);
      font-size: functions.rem(13);
      color: kit.$muted;

      .dot {
        @include kit.live-dot(kit.$green);
      }

      &.warning .dot {
        @include kit.live-dot(kit.$red);
      }

      @media (max-width: 640px) {
        display: none;
      }
    }

    .main {
      max-width: functions.rem(1200);
      margin: 0 auto;
      padding: functions.rem(24) functions.rem(16) functions.rem(64);

      @media (min-width: 900px) {
        padding-top: functions.rem(32);
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClassicComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(ClassicState);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly items = [
    { name: 'overview' as const, label: 'Übersicht' },
    { name: 'questions' as const, label: 'Fragen' },
    { name: 'settings' as const, label: 'Einstellungen' },
  ];
  /** A question page belongs to the questions tab. */
  protected readonly section = computed(() => {
    const name = this.state.page().name;
    return name === 'question' ? 'questions' : name;
  });
}
