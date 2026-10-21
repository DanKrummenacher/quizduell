// TEMPORARY: proposal M «Aufgaben» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { RulesDrawerComponent } from '../board/rules-drawer.component';
import { ProposalPro } from '../pro';
import { ProposalStore, successRate } from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';
import { SaveRulesDialogComponent } from '../shared/save-rules-dialog.component';
import { WorkspaceNav } from '../workspace/workspace-nav';
import { WsQuestionsComponent } from '../workspace/ws-questions.component';
import { type Task, TASK_LABELS, TaskInbox, type TaskKind } from './tasks';

/**
 * The admin as an inbox, as in modern support and review tools: it finds
 * what needs attention and offers the right actions for each task, with
 * keys for the fast way (J/K, E, P, A, D). When the inbox is empty, the
 * quiz is in good shape.
 */
@Component({
  selector: 'app-tasks',
  imports: [
    LogoMarkComponent,
    ProposalDialogsComponent,
    RulesDrawerComponent,
    SaveRulesDialogComponent,
    WsQuestionsComponent,
  ],
  providers: [TaskInbox, WorkspaceNav],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '(document:keydown)': 'onKey($event)' },
})
export class TasksComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly inbox = inject(TaskInbox);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly labels = TASK_LABELS;
  protected readonly letters = ANSWER_LETTERS;
  protected readonly rate = successRate;
  protected readonly view = signal<'tasks' | 'questions'>('tasks');
  protected readonly showDone = signal(false);
  protected readonly kind = signal<TaskKind | null>(null);
  protected readonly selectedKey = signal<string | null>(null);
  protected readonly rulesOpen = signal(false);
  protected readonly reviewing = signal(false);

  protected readonly kinds = computed(() => {
    const counts = new Map<TaskKind, number>();
    for (const task of this.inbox.open()) {
      counts.set(task.kind, (counts.get(task.kind) ?? 0) + 1);
    }
    return [...counts.entries()].map(([kind, count]) => ({
      kind,
      count,
      label: TASK_LABELS[kind],
    }));
  });
  protected readonly list = computed(() => {
    const source = this.showDone() ? this.inbox.closed() : this.inbox.open();
    const kind = this.kind();
    return kind ? source.filter((t) => t.kind === kind) : source;
  });
  protected readonly selected = computed<Task | null>(() => {
    const list = this.list();
    return list.find((t) => t.key === this.selectedKey()) ?? list[0] ?? null;
  });
  protected readonly position = computed(() => {
    const selected = this.selected();
    return selected ? this.list().indexOf(selected) : -1;
  });

  protected select(task: Task): void {
    this.selectedKey.set(task.key);
  }

  /** Moves the selection; after a solved task the next one follows. */
  protected move(step: number): void {
    const list = this.list();
    const next =
      list[Math.min(list.length - 1, Math.max(0, this.position() + step))];
    if (next) {
      this.selectedKey.set(next.key);
    }
  }

  protected done(task: Task): void {
    const next = this.list()[this.position() + 1];
    this.inbox.markDone(task);
    this.selectedKey.set(next?.key ?? null);
  }

  protected async setActive(
    question: AdminQuestion,
    active: boolean,
  ): Promise<void> {
    const next = this.list()[this.position() + 1];
    await this.store.setActive(question, active);
    this.selectedKey.set(next?.key ?? null);
  }

  protected async activateAll(questions: AdminQuestion[]): Promise<void> {
    await this.pro.setActiveMany(questions, true);
  }

  protected onKey(event: KeyboardEvent): void {
    const task = this.selected();
    if (
      this.view() !== 'tasks' ||
      !task ||
      this.store.editing() ||
      this.store.confirm() ||
      this.rulesOpen() ||
      this.reviewing() ||
      (event.target as HTMLElement).closest('input, textarea, select') ||
      event.metaKey ||
      event.ctrlKey
    ) {
      return;
    }
    const question = task.questions[0];
    const key = event.key.toLowerCase();
    if (key === 'j' || key === 'arrowdown') {
      this.move(1);
    } else if (key === 'k' || key === 'arrowup') {
      this.move(-1);
    } else if (key === 'e' && question) {
      this.store.openEditor(question);
    } else if (key === 'p' && question?.active) {
      void this.setActive(question, false);
    } else if (key === 'a' && question && !question.active) {
      void this.setActive(question, true);
    } else if (key === 'd' && !this.showDone()) {
      this.done(task);
    } else {
      return;
    }
    event.preventDefault();
  }
}
