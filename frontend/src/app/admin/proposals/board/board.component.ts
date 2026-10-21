// TEMPORARY: proposal E «Board» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { ProposalStore, successRate } from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';
import { RulesDrawerComponent } from './rules-drawer.component';

/**
 * The questions as cards on a board, one column per category, as in a
 * planning tool: drag a card into another column to change its category,
 * pause it with one click, open it to edit. The rules slide in from the side.
 */
@Component({
  selector: 'app-board',
  imports: [LogoMarkComponent, ProposalDialogsComponent, RulesDrawerComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BoardComponent {
  protected readonly store = inject(ProposalStore);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly rate = successRate;
  protected readonly rulesOpen = signal(false);
  protected readonly showInactive = signal(true);
  protected readonly search = signal('');
  /** The card being dragged and the column it hovers. */
  protected readonly dragging = signal<AdminQuestion | null>(null);
  protected readonly over = signal<string | null>(null);

  protected readonly columns = computed(() => {
    const term = this.search().trim().toLowerCase();
    const visible = (this.store.questions() ?? []).filter(
      (q) =>
        (this.showInactive() || q.active) &&
        (!term ||
          [q.text, ...q.options].some((value) =>
            value.toLowerCase().includes(term),
          )),
    );
    return this.store.categoryStats().map((category) => ({
      ...category,
      cards: visible.filter((q) => (q.category ?? '') === category.name),
    }));
  });

  protected onDragStart(event: DragEvent, question: AdminQuestion): void {
    this.dragging.set(question);
    event.dataTransfer?.setData('text/plain', String(question.id));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected onDragOver(event: DragEvent, column: string): void {
    const question = this.dragging();
    if (question && (question.category ?? '') !== column) {
      event.preventDefault();
      this.over.set(column);
    }
  }

  protected onDrop(event: DragEvent, column: string): void {
    event.preventDefault();
    const question = this.dragging();
    this.endDrag();
    if (question) {
      void this.store.moveQuestion(question, column || null);
    }
  }

  protected endDrag(): void {
    this.dragging.set(null);
    this.over.set(null);
  }

  protected typed(event: Event): string {
    return (event.target as HTMLInputElement).value ?? '';
  }
}
