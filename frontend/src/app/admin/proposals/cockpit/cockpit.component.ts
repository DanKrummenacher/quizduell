// TEMPORARY: proposal A «Cockpit» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import '@css-ch/components/notification';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { BrandHeaderComponent } from '../../../core/ui/brand-header/brand-header.component';
import { ProposalStore } from '../proposal-store';
import { CockpitOverviewComponent } from './cockpit-overview.component';
import { CockpitQuestionsComponent } from './cockpit-questions.component';
import { CockpitSettingsComponent } from './cockpit-settings.component';

export type CockpitView = 'overview' | 'questions' | 'settings';

/**
 * A work place as in a professional tool: a dark navigation on the left
 * (at the bottom on phones) with the live state always in view, a table of
 * the questions and the rules with a live picture of one duel.
 */
@Component({
  selector: 'app-cockpit',
  imports: [
    LogoMarkComponent,
    BrandHeaderComponent,
    CockpitOverviewComponent,
    CockpitQuestionsComponent,
    CockpitSettingsComponent,
  ],
  templateUrl: './cockpit.component.html',
  styleUrl: './cockpit.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CockpitComponent {
  protected readonly store = inject(ProposalStore);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly view = signal<CockpitView>('overview');
  protected readonly nav = computed(() => [
    { key: 'overview' as const, label: 'Übersicht', icon: 'statistic', count: null },
    {
      key: 'questions' as const,
      label: 'Fragen',
      icon: 'items-list',
      count: this.store.counts().total || null,
    },
    {
      key: 'settings' as const,
      label: 'Spielregeln',
      icon: 'settings',
      count: null,
    },
  ]);

  protected go(view: CockpitView): void {
    this.view.set(view);
    window.scrollTo({ top: 0 });
  }
}
