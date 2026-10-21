// TEMPORARY: proposal C «Fragen-Studio», list and editor side by side (development only).
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
import '@css-ch/components/input-text';
import '@css-ch/components/spinner';
import '@css-ch/components/toggle-group';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { eventText } from '../../../core/ui/component-events';
import { ProposalStore, type StatusFilter, successRate } from '../proposal-store';
import { StudioEditorComponent } from './studio-editor.component';

@Component({
  selector: 'app-studio-questions',
  imports: [StudioEditorComponent],
  templateUrl: './studio-questions.component.html',
  styleUrl: './studio-questions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StudioQuestionsComponent {
  protected readonly store = inject(ProposalStore);

  protected readonly rate = successRate;
  /** The open question: its id, 'new', or none (the start panel). */
  protected readonly selected = signal<number | 'new' | null>(null);
  protected readonly confirmAll = signal(false);
  protected readonly statusOptions = [
    { label: 'Alle', value: 'all' },
    { label: 'Aktiv', value: 'active' },
    { label: 'Inaktiv', value: 'inactive' },
  ];

  protected readonly current = computed<AdminQuestion | null>(() => {
    const id = this.selected();
    return typeof id === 'number'
      ? ((this.store.questions() ?? []).find((q) => q.id === id) ?? null)
      : null;
  });

  constructor() {
    this.store.search.set('');
    this.store.status.set('all');
    this.store.category.set(null);
  }

  protected setSearch(event: Event): void {
    this.store.search.set((event.target as HTMLInputElement).value ?? '');
  }

  protected setStatus(event: Event): void {
    this.store.status.set(eventText(event) as StatusFilter);
  }

  protected setCategory(name: string | null): void {
    this.store.category.set(this.store.category() === name ? null : name);
  }

  protected open(id: number | 'new'): void {
    this.selected.set(id);
    if (window.matchMedia('(max-width: 899px)').matches) {
      window.scrollTo({ top: 0 });
    }
  }

  protected async deleteAll(): Promise<void> {
    if (await this.store.deleteAll()) {
      this.confirmAll.set(false);
      this.selected.set(null);
    }
  }
}
