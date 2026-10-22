// Atelier: bulk actions for the selected questions, with «Rückgängig».
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../../proposals/pro';
import { ProposalStore } from '../../proposals/proposal-store';
import { AtelierState } from './atelier-state';

const NONE = '__none__';

@Component({
  selector: 'app-atelier-bulk',
  templateUrl: './atelier-bulk.component.html',
  styleUrl: './atelier-bulk.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AtelierBulkComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  private readonly state = inject(AtelierState);

  protected readonly none = NONE;
  protected readonly confirmDelete = signal(false);

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  protected async bulkActive(active: boolean): Promise<void> {
    const selection = this.pro.selectedQuestions();
    const changed = selection.filter((q) => q.active !== active);
    await this.pro.setActiveMany(selection, active);
    this.store.message.set(null);
    this.state.toast(
      `${changed.length} ${changed.length === 1 ? 'Frage' : 'Fragen'} ${active ? 'aktiviert' : 'pausiert'}`,
      async () => {
        await this.pro.setActiveMany(
          changed.map((q) => ({ ...q, active })),
          !active,
        );
        this.store.message.set(null);
      },
    );
  }

  protected async bulkMove(value: string): Promise<void> {
    if (!value) {
      return;
    }
    const selection = this.pro.selectedQuestions();
    const before = selection.map((q) => ({ q, category: q.category ?? null }));
    const target = value === NONE ? null : value;
    await this.pro.setCategoryMany(selection, target);
    this.store.message.set(null);
    this.state.toast(
      `${selection.length} ${selection.length === 1 ? 'Frage' : 'Fragen'} nach «${target ?? 'Ohne Kategorie'}» verschoben`,
      async () => {
        for (const { q, category } of before) {
          await this.store.moveQuestion({ ...q, category: target }, category);
        }
        this.store.message.set(null);
      },
    );
  }

  protected async bulkDelete(): Promise<void> {
    await this.pro.deleteMany(this.pro.selectedQuestions());
    this.confirmDelete.set(false);
  }
}
