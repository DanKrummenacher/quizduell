// TEMPORARY: proposal K «Pocket» (development only).
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../pro';
import { ProposalStore } from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';
import { PocketEditorComponent } from './pocket-editor.component';
import { PocketLiveComponent } from './pocket-live.component';
import { PocketMoreComponent } from './pocket-more.component';
import { PocketQuestionsComponent } from './pocket-questions.component';
import { PocketRulesComponent } from './pocket-rules.component';

export type PocketTab = 'live' | 'questions' | 'rules' | 'more';

/**
 * The admin as an app for the phone in the pocket at the stand: tabs at the
 * bottom, large lists to tap, editing on its own page, values in sheets.
 * On a larger screen it stays an app-sized column.
 */
@Component({
  selector: 'app-pocket',
  imports: [
    ProposalDialogsComponent,
    PocketEditorComponent,
    PocketLiveComponent,
    PocketQuestionsComponent,
    PocketRulesComponent,
    PocketMoreComponent,
  ],
  template: `
    <div class="app">
      <div class="screen">
        @switch (tab()) {
          @case ('live') {
            <app-pocket-live (go)="go($event)" />
          }
          @case ('questions') {
            <app-pocket-questions [issuesOnly]="issuesOnly()" />
          }
          @case ('rules') {
            <app-pocket-rules />
          }
          @case ('more') {
            <app-pocket-more (openGame)="openGame.emit()" (logout)="logout.emit()" />
          }
        }
      </div>

      <nav class="tabbar" aria-label="Admin-Navigation">
        @for (item of tabs; track item.key) {
          <button
            type="button"
            class="tab"
            [class.active]="tab() === item.key"
            [attr.aria-current]="tab() === item.key ? 'page' : null"
            (click)="go(item.key)"
          >
            <span class="tab-icon">
              <css-icon [icon]="item.icon"></css-icon>
              @if (item.key === 'rules' && store.dirty()) {
                <span class="badge"></span>
              }
              @if (item.key === 'questions' && pro.issueCount()) {
                <span class="badge count">{{ pro.issueCount() }}</span>
              }
            </span>
            {{ item.label }}
          </button>
        }
      </nav>
    </div>
    <app-pocket-editor />
    <app-proposal-dialogs [editor]="false" />
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';
    @use 'pocket';

    :host {
      display: block;
      min-height: 100dvh;
      background-color: pocket.$bg;

      @media (min-width: 600px) {
        background:
          radial-gradient(rgba(0, 50, 125, 0.08) 1.2px, transparent 1.4px) 0 0 / 22px
            22px,
          #e8edf4;
      }
    }

    .app {
      position: relative;
      max-width: functions.rem(480);
      min-height: 100dvh;
      margin: 0 auto;
      background-color: pocket.$bg;

      @media (min-width: 600px) {
        box-shadow: 0 0 functions.rem(40) rgba(0, 50, 125, 0.12);
      }
    }

    .screen {
      padding: var(--app-safe-top) 0
        calc(var(--app-safe-bottom) + #{functions.rem(96)});
    }

    .tabbar {
      position: fixed;
      bottom: 0;
      left: 50%;
      z-index: 10;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      width: min(100%, #{functions.rem(480)});
      padding: functions.rem(6) functions.rem(8)
        calc(var(--app-safe-bottom) + #{functions.rem(6)});
      border-top: functions.rem(1) solid pocket.$sep;
      background-color: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      transform: translateX(-50%);
    }

    .tab {
      display: grid;
      justify-items: center;
      gap: functions.rem(2);
      padding: functions.rem(6) 0;
      border: 0;
      background: none;
      font: inherit;
      font-size: functions.rem(11);
      color: kit.$muted;
      cursor: pointer;

      &.active {
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
      }
    }

    .tab-icon {
      position: relative;
    }

    .badge {
      position: absolute;
      top: functions.rem(-2);
      right: functions.rem(-6);
      width: functions.rem(10);
      height: functions.rem(10);
      border: functions.rem(2) solid kit.$white;
      border-radius: 50%;
      background-color: #ffc015;

      &.count {
        right: functions.rem(-14);
        width: auto;
        min-width: functions.rem(18);
        height: functions.rem(18);
        padding: 0 functions.rem(4);
        border-radius: functions.rem(9);
        background-color: kit.$red;
        font-size: functions.rem(10);
        font-weight: miscs.$css-ui-font-weight-bold;
        line-height: functions.rem(14);
        color: kit.$white;
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PocketComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly tab = signal<PocketTab>('live');
  protected readonly issuesOnly = signal(false);
  protected readonly tabs: { key: PocketTab; label: string; icon: string }[] = [
    { key: 'live', label: 'Live', icon: 'statistic' },
    { key: 'questions', label: 'Fragen', icon: 'items-list' },
    { key: 'rules', label: 'Regeln', icon: 'settings' },
    { key: 'more', label: 'Mehr', icon: 'more' },
  ];

  protected go(target: PocketTab | 'issues'): void {
    this.issuesOnly.set(target === 'issues');
    this.tab.set(target === 'issues' ? 'questions' : target);
    window.scrollTo({ top: 0 });
  }
}
