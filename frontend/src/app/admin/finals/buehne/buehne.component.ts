// Final 2 «Bühne»: the admin as a touch cockpit for the fair stand.
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { ProposalPro } from '../../proposals/pro';
import { ProposalStore } from '../../proposals/proposal-store';
import { ProposalDialogsComponent } from '../../proposals/shared/proposal-dialogs.component';
import { BuehneEditorComponent } from './buehne-editor.component';
import { BuehneLiveComponent } from './buehne-live.component';
import { BuehneMoreComponent } from './buehne-more.component';
import { BuehneQuestionsComponent } from './buehne-questions.component';
import { BuehneRulesComponent } from './buehne-rules.component';
import { BuehneState, type BuehneTab } from './buehne-state';

/**
 * In the look of the game itself: a deep blue stage, white cards and big
 * targets for the thumb. Questions are edited in a full-screen flow of
 * three steps, the rules are presets with large sliders.
 */
@Component({
  selector: 'app-buehne',
  imports: [
    LogoMarkComponent,
    ProposalDialogsComponent,
    BuehneLiveComponent,
    BuehneQuestionsComponent,
    BuehneRulesComponent,
    BuehneMoreComponent,
    BuehneEditorComponent,
  ],
  providers: [BuehneState],
  templateUrl: './buehne.component.html',
  styleUrl: './buehne.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BuehneComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(BuehneState);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly tabs: { key: BuehneTab; label: string; icon: string }[] = [
    { key: 'live', label: 'Live', icon: 'statistic' },
    { key: 'questions', label: 'Fragen', icon: 'items-list' },
    { key: 'rules', label: 'Regeln', icon: 'settings' },
    { key: 'more', label: 'Mehr', icon: 'more' },
  ];

  constructor() {
    // Messages of the data layer appear as the notice of the stage.
    effect(() => {
      const message = this.store.message();
      if (message) {
        this.state.say(message.text);
        this.store.message.set(null);
      }
    });
  }
}
