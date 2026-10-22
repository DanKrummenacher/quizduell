// Final 1 «Atelier»: the admin as a precise desktop tool.
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { ProposalPro } from '../../proposals/pro';
import { ProposalStore } from '../../proposals/proposal-store';
import { ProposalDialogsComponent } from '../../proposals/shared/proposal-dialogs.component';
import { AtelierOverviewComponent } from './atelier-overview.component';
import { AtelierPaletteComponent } from './atelier-palette.component';
import { AtelierQuestionsComponent } from './atelier-questions.component';
import { AtelierRulesComponent } from './atelier-rules.component';
import { AtelierState, type AtelierView } from './atelier-state';

/**
 * A work place on the level of today's best product tools: a quiet sidebar
 * with the categories, a table in which every question opens in place with
 * a live preview, filters as pills, bulk actions, a command palette (⌘K),
 * keys for everything frequent and «Rückgängig» after every change.
 */
@Component({
  selector: 'app-atelier',
  imports: [
    LogoMarkComponent,
    AtelierOverviewComponent,
    AtelierQuestionsComponent,
    AtelierRulesComponent,
    AtelierPaletteComponent,
    ProposalDialogsComponent,
  ],
  providers: [AtelierState],
  templateUrl: './atelier.component.html',
  styleUrl: './atelier.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    '(document:keydown)': 'onKey($event)',
    '(window:beforeunload)': 'guard($event)',
  },
})
export class AtelierComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(AtelierState);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly nav = computed<
    { key: AtelierView; label: string; icon: string; meta: string }[]
  >(() => [
    {
      key: 'overview',
      label: 'Übersicht',
      icon: 'statistic',
      meta: '',
    },
    {
      key: 'questions',
      label: 'Fragen',
      icon: 'items-list',
      meta: String(this.store.counts().total || ''),
    },
    {
      key: 'rules',
      label: 'Spielregeln',
      icon: 'settings',
      meta: this.store.dirty() ? '•' : '',
    },
  ]);

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    return hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
  });

  protected openCategory(name: string): void {
    this.state.showQuestions({ category: name });
  }

  protected onKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.state.paletteOpen.set(!this.state.paletteOpen());
      return;
    }
    const typing = (event.target as HTMLElement).closest(
      'input, textarea, select, [contenteditable], css-input-text, css-input-textarea, css-input-stepper',
    );
    if (
      typing ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      this.state.paletteOpen()
    ) {
      return;
    }
    if (event.key === 'n' && !this.store.editing()) {
      event.preventDefault();
      this.state.newQuestion();
    } else if (event.key === '/') {
      event.preventDefault();
      this.state.go('questions');
      setTimeout(() =>
        document.querySelector<HTMLInputElement>('#atelier-search')?.focus(),
      );
    } else if (event.key === 'Escape' && this.state.open() !== null) {
      this.state.open.set(null);
    }
  }

  protected guard(event: BeforeUnloadEvent): void {
    if (this.store.dirty()) {
      event.preventDefault();
    }
  }
}
