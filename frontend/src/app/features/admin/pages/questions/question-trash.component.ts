import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import {
  TRASH_DAYS,
  type TrashedQuestion,
} from '../../../../core/contracts/admin.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { ConfirmService } from '../../core/confirm.service';
import { formatInt, formatRelative, plural, questionCode } from '../../core/format';
import { NotifyService } from '../../core/notify.service';
import { AutofocusDirective } from '../../ui/autofocus.directive';
import { AdStateComponent } from '../../ui/state.component';
import { messageOf } from './questions.component';

const DAY_MS = 86_400_000;

/** Deleted questions: restore them, or delete them for good. */
@Component({
  selector: 'app-question-trash',
  imports: [AutofocusDirective, AdStateComponent],
  templateUrl: './question-trash.component.html',
  styleUrl: './question-trash.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuestionTrashComponent {
  readonly closed = output<void>();

  private readonly api = inject(AdminApi);
  protected readonly data = inject(AdminData);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotifyService);

  protected readonly days = TRASH_DAYS;
  protected readonly formatInt = formatInt;
  protected readonly formatRelative = formatRelative;
  protected readonly code = questionCode;
  protected readonly letters = ['A', 'B', 'C', 'D'];
  /** Ids with a request on its way, so their buttons wait. */
  protected readonly busy = signal<ReadonlySet<number>>(new Set());
  protected readonly emptying = signal(false);

  protected readonly items = computed(() => this.data.trash.value() ?? []);

  constructor() {
    void this.data.trash.reload();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.confirm.request()) {
      this.closed.emit();
    }
  }

  /** «noch 29 Tage» until the question is removed for good. */
  protected left(item: TrashedQuestion): string {
    const days = Math.max(
      0,
      Math.ceil((Date.parse(item.expiresAt) - Date.now()) / DAY_MS),
    );
    return days <= 1 ? 'noch heute' : `noch ${days} Tage`;
  }

  protected async restore(item: TrashedQuestion): Promise<void> {
    this.mark(item.id, true);
    try {
      if ((await this.data.restoreQuestions([item.id])) === 1) {
        this.notify.success(`${questionCode(item.id)} ist wieder im Katalog`);
      } else {
        this.notify.error('Die Frage ist nicht mehr im Papierkorb.');
      }
    } finally {
      this.mark(item.id, false);
    }
  }

  protected async purge(item: TrashedQuestion): Promise<void> {
    const sure = await this.confirm.ask({
      title: `${questionCode(item.id)} endgültig löschen?`,
      text: 'Die Frage lässt sich danach nicht mehr wiederherstellen.',
      confirm: 'Endgültig löschen',
      danger: true,
    });
    if (!sure) {
      return;
    }
    this.mark(item.id, true);
    try {
      await this.api.purgeTrash(item.id);
      this.data.trash.update((all) => all.filter((q) => q.id !== item.id));
      this.notify.success(`${questionCode(item.id)} endgültig gelöscht`);
    } catch (error) {
      this.notify.error(messageOf(error));
      void this.data.trash.reload();
    } finally {
      this.mark(item.id, false);
    }
  }

  protected async empty(): Promise<void> {
    const count = plural(this.items().length, 'Frage', 'Fragen');
    const sure = await this.confirm.ask({
      title: 'Papierkorb leeren?',
      text: `${count} werden endgültig gelöscht und lassen sich nicht mehr wiederherstellen.`,
      confirm: 'Papierkorb leeren',
      danger: true,
    });
    if (!sure) {
      return;
    }
    this.emptying.set(true);
    try {
      await this.api.purgeTrash();
      this.data.trash.set([]);
      this.notify.success(`${count} endgültig gelöscht`);
    } catch (error) {
      this.notify.error(messageOf(error));
      void this.data.trash.reload();
    } finally {
      this.emptying.set(false);
    }
  }

  protected isBusy(id: number): boolean {
    return this.emptying() || this.busy().has(id);
  }

  private mark(id: number, on: boolean): void {
    this.busy.update((current) => {
      const next = new Set(current);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
