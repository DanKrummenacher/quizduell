// TEMPORARY: proposal N «Schreibmodus» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import '@css-ch/components/icon';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { toInput } from '../../questions/question-form';
import { AdminApi } from '../../admin-api.service';
import { RulesDrawerComponent } from '../board/rules-drawer.component';
import { apiErrorMessage, ProposalStore } from '../proposal-store';
import { readJson, writeJson } from '../shared/json-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';
import { parseText, type TextBlock, toText } from './question-text';

const DRAFT_KEY = 'playduelio.admin.writerDraft';

const EXAMPLE = `# Natur

? Wie viele Beine hat eine Spinne?
- 6
+ 8
- 10
- 12
`;

/**
 * Questions are written, not clicked together: the catalogue as a text
 * with a short notation. New questions are typed one after the other,
 * existing ones are changed right in the text; a live check shows what
 * happens before anything is saved.
 */
@Component({
  selector: 'app-writer',
  imports: [LogoMarkComponent, ProposalDialogsComponent, RulesDrawerComponent],
  templateUrl: './writer.component.html',
  styleUrl: './writer.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WriterComponent {
  protected readonly store = inject(ProposalStore);
  private readonly api = inject(AdminApi);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly text = signal(readJson<string>(DRAFT_KEY) ?? '');
  protected readonly rulesOpen = signal(false);
  protected readonly applying = signal<{ done: number; total: number } | null>(null);
  private readonly editor = viewChild<ElementRef<HTMLTextAreaElement>>('editor');

  protected readonly blocks = computed(() =>
    parseText(this.text(), this.store.questions() ?? []),
  );
  protected readonly summary = computed(() => {
    const blocks = this.blocks();
    return {
      new: blocks.filter((b) => b.state === 'new').length,
      changed: blocks.filter((b) => b.state === 'changed').length,
      same: blocks.filter((b) => b.state === 'same').length,
      error: blocks.filter((b) => b.state === 'error').length,
    };
  });
  /** Line numbers for the gutter. */
  protected readonly lines = computed(() =>
    Array.from({ length: this.text().split('\n').length }, (_, i) => i + 1),
  );

  protected setText(value: string): void {
    this.text.set(value);
    writeJson(DRAFT_KEY, value);
  }

  protected loadCatalogue(): void {
    this.setText(toText(this.store.questions() ?? []));
  }

  protected insertExample(): void {
    const current = this.text().trimEnd();
    this.setText(current ? `${current}\n\n${EXAMPLE}` : EXAMPLE);
  }

  protected clear(): void {
    this.setText('');
  }

  /** Jumps to the line of a block in the text. */
  protected reveal(block: TextBlock): void {
    const area = this.editor()?.nativeElement;
    if (!area) {
      return;
    }
    const lines = this.text().split('\n');
    const start =
      lines.slice(0, block.line - 1).join('\n').length + (block.line > 1 ? 1 : 0);
    area.focus();
    area.setSelectionRange(start, start + (lines[block.line - 1]?.length ?? 0));
    const lineHeight = parseFloat(getComputedStyle(area).lineHeight) || 22;
    area.scrollTop = Math.max(0, (block.line - 4) * lineHeight);
  }

  /** Creates the new and saves the changed questions. */
  protected async apply(): Promise<void> {
    const todo = this.blocks().filter(
      (b) => b.state === 'new' || b.state === 'changed',
    );
    this.applying.set({ done: 0, total: todo.length });
    try {
      for (const block of todo) {
        if (block.id === null) {
          await this.api.createQuestion(toInput(block.draft));
        } else {
          await this.api.updateQuestion(block.id, toInput(block.draft));
        }
        this.applying.update((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
      await this.store.loadQuestions();
      void this.store.loadStats();
      this.store.flash(
        'success',
        `${todo.length} ${todo.length === 1 ? 'Frage' : 'Fragen'} übernommen.`,
      );
      // Without faulty blocks, the text shows the saved catalogue with the
      // new ids; otherwise it stays, and created questions count as existing.
      if (!this.summary().error) {
        this.loadCatalogue();
      }
    } catch (error) {
      this.store.flash('error', apiErrorMessage(error));
      await this.store.loadQuestions();
    } finally {
      this.applying.set(null);
    }
  }

  /** Cmd+S or Ctrl+S applies the changes. */
  protected onKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (this.summary().new + this.summary().changed > 0 && !this.applying()) {
        void this.apply();
      }
    }
  }
}
