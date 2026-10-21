// TEMPORARY: proposal L «Klassik», the list of questions (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import { ProposalPro } from '../pro';
import { ProposalStore, successRate } from '../proposal-store';
import { ImportDialogComponent } from '../shared/import-dialog.component';
import { ClassicState } from './classic-state';

const PAGE_SIZE = 15;
const NONE = '__none__';

@Component({
  selector: 'app-classic-questions',
  imports: [ImportDialogComponent],
  templateUrl: './classic-questions.component.html',
  styleUrl: './classic-questions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClassicQuestionsComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(ClassicState);

  protected readonly rate = successRate;
  protected readonly none = NONE;
  protected readonly search = signal('');
  protected readonly category = signal('');
  protected readonly importing = signal(false);
  protected readonly confirmDelete = signal(false);

  private readonly issueIds = computed(
    () => new Set(this.pro.issues().flatMap((i) => i.ids)),
  );
  protected readonly tabs = computed(() => {
    const all = this.store.questions() ?? [];
    return [
      { key: 'all' as const, label: 'Alle', count: all.length },
      {
        key: 'active' as const,
        label: 'Aktiv',
        count: all.filter((q) => q.active).length,
      },
      {
        key: 'paused' as const,
        label: 'Pausiert',
        count: all.filter((q) => !q.active).length,
      },
      {
        key: 'issues' as const,
        label: 'Mit Hinweisen',
        count: this.issueIds().size,
      },
    ];
  });

  protected readonly filtered = computed(() => {
    const tab = this.state.tab();
    const term = this.search().trim().toLowerCase();
    const category = this.category();
    return (this.store.questions() ?? [])
      .filter(
        (q) =>
          (tab === 'all' ||
            (tab === 'active' && q.active) ||
            (tab === 'paused' && !q.active) ||
            (tab === 'issues' && this.issueIds().has(q.id))) &&
          (!category || (q.category ?? NONE) === category) &&
          (!term ||
            [q.text, q.category ?? '', ...q.options].some((v) =>
              v.toLowerCase().includes(term),
            )),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });
  protected readonly pages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );
  protected readonly page = computed(() =>
    Math.min(this.state.listPage(), this.pages() - 1),
  );
  protected readonly rows = computed(() =>
    this.filtered().slice(this.page() * PAGE_SIZE, (this.page() + 1) * PAGE_SIZE),
  );
  protected readonly range = computed(() => {
    const total = this.filtered().length;
    const from = total ? this.page() * PAGE_SIZE + 1 : 0;
    return `${from}–${Math.min(total, (this.page() + 1) * PAGE_SIZE)} von ${total}`;
  });
  protected readonly pageSelected = computed(
    () =>
      this.rows().length > 0 && this.rows().every((q) => this.pro.isSelected(q.id)),
  );

  protected typed(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected setTab(tab: 'all' | 'active' | 'paused' | 'issues'): void {
    this.state.tab.set(tab);
    this.state.listPage.set(0);
  }

  protected setSearch(value: string): void {
    this.search.set(value);
    this.state.listPage.set(0);
  }

  protected async bulk(action: string): Promise<void> {
    const selection = this.pro.selectedQuestions();
    if (action === 'activate') {
      await this.pro.setActiveMany(selection, true);
    } else if (action === 'pause') {
      await this.pro.setActiveMany(selection, false);
    } else if (action === 'export') {
      this.pro.exportCsv(selection);
    } else if (action === 'delete') {
      this.confirmDelete.set(true);
    } else if (action.startsWith('move:')) {
      const target = action.slice(5);
      await this.pro.setCategoryMany(selection, target === NONE ? null : target);
    }
  }

  protected async remove(): Promise<void> {
    await this.pro.deleteMany(this.pro.selectedQuestions());
    this.confirmDelete.set(false);
  }
}
