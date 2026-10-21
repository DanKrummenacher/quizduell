// TEMPORARY: proposal J «Workspace» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { ProposalPro } from '../pro';
import { ProposalStore } from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';
import { WsCategoriesComponent } from './ws-categories.component';
import { WsOverviewComponent } from './ws-overview.component';
import { WsQuestionsComponent } from './ws-questions.component';
import { WsRulesComponent } from './ws-rules.component';
import { WorkspaceNav, type WorkspaceView } from './workspace-nav';

/**
 * A professional work place for the desktop, as in today's product tools:
 * a light sidebar, tables with selection and bulk actions, a detail column
 * to edit without leaving the list, categories and a quality check. On
 * phones the sidebar becomes a menu.
 */
@Component({
  selector: 'app-workspace',
  imports: [
    LogoMarkComponent,
    ProposalDialogsComponent,
    WsOverviewComponent,
    WsQuestionsComponent,
    WsCategoriesComponent,
    WsRulesComponent,
  ],
  providers: [WorkspaceNav],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '(window:beforeunload)': 'guard($event)' },
})
export class WorkspaceComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly nav = inject(WorkspaceNav);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly items = computed<
    {
      key: WorkspaceView;
      label: string;
      icon: string;
      count: number | null;
      alert: boolean;
    }[]
  >(() => [
    {
      key: 'overview',
      label: 'Übersicht',
      icon: 'statistic',
      count: null,
      alert: false,
    },
    {
      key: 'questions',
      label: 'Fragen',
      icon: 'items-list',
      count: this.store.counts().total,
      alert: false,
    },
    {
      key: 'categories',
      label: 'Kategorien',
      icon: 'bulleted-list',
      count: this.store.categoryStats().length,
      alert: false,
    },
    {
      key: 'rules',
      label: 'Spielregeln',
      icon: 'settings',
      count: null,
      alert: this.store.dirty(),
    },
  ]);
  protected readonly title = computed(
    () => this.items().find((item) => item.key === this.nav.view())?.label ?? '',
  );

  /** Unsaved rules: the browser asks before leaving. */
  protected guard(event: BeforeUnloadEvent): void {
    if (this.store.dirty()) {
      event.preventDefault();
    }
  }
}
