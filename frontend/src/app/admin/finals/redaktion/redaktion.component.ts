// Final 3 «Redaktion»: the questions kept like documents.
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { ProposalPro } from '../../proposals/pro';
import { ProposalStore } from '../../proposals/proposal-store';
import { ImportDialogComponent } from '../../proposals/shared/import-dialog.component';
import { ProposalDialogsComponent } from '../../proposals/shared/proposal-dialogs.component';
import { RedaktionCategoryComponent } from './redaktion-category.component';
import { RedaktionRulesComponent } from './redaktion-rules.component';
import { RedaktionStartComponent } from './redaktion-start.component';
import { RedaktionState } from './redaktion-state';

/**
 * Like a modern writing tool: the categories are pages in the sidebar,
 * every question is a block of the page that is edited right where it is
 * and saves itself. Next to the text, the question with the cursor shows
 * as the players will see it. The rules are a text with values in it.
 */
@Component({
  selector: 'app-redaktion',
  imports: [
    LogoMarkComponent,
    ImportDialogComponent,
    ProposalDialogsComponent,
    RedaktionStartComponent,
    RedaktionCategoryComponent,
    RedaktionRulesComponent,
  ],
  providers: [RedaktionState],
  templateUrl: './redaktion.component.html',
  styleUrl: './redaktion.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RedaktionComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(RedaktionState);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly current = computed(() => {
    const page = this.state.page();
    return page.kind === 'category' ? page.name : null;
  });
  /** A new category shows in the list while its first question is written. */
  protected readonly pages = computed(() => {
    const list = this.store
      .categoryStats()
      .map((c) => ({ name: c.name, total: c.total, active: c.active }));
    const current = this.current();
    if (current !== null && !list.some((c) => c.name === current)) {
      list.push({ name: current, total: 0, active: 0 });
    }
    return list;
  });
}
