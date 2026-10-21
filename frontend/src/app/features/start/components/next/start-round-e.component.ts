import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import { PLAYER_NAME_MAX_LENGTH } from '../../../../core/contracts/game.contract';
import { shapeRing } from '../../../../core/branding/logo-shapes';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import type { StartLayout } from './start-design';

/** E2: the answer turns green for a moment before the lobby opens. */
const ANSWER_FEEDBACK_MS = 450;
/** E3: the slides move on by themselves. */
const SLIDE_INTERVAL_MS = 3500;

/**
 * TEMPORARY (round 5): start page concepts with their own structure and
 * their own way of asking for the name. Same result as today: a name, then
 * off to the lobby.
 */
@Component({
  selector: 'app-start-round-e',
  imports: [BrandHeaderComponent, NgTemplateOutlet],
  templateUrl: './start-round-e.component.html',
  styleUrl: './start-round-e.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class StartRoundEComponent implements OnInit {
  readonly layout = input.required<StartLayout>();
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  protected readonly ring = shapeRing();
  protected readonly playerName = signal('');
  protected readonly errorMessage = signal('');

  protected readonly cleanName = computed(() =>
    this.playerName().replace(/\s+/g, ' ').trim(),
  );

  /** E1: the name is asked on a sheet after the first tap. */
  protected readonly sheetOpen = signal(false);
  /** E2: the answer was given. */
  protected readonly answered = signal(false);

  /** E3: the onboarding slides. */
  protected readonly slide = signal(0);
  protected readonly slides = computed(() => [
    {
      title: 'Wissen',
      text: `${this.questions()} Fragen aus allen Bereichen`,
      icon: 'survey',
    },
    {
      title: 'Tempo',
      text: `${this.seconds()} Sekunden pro Frage`,
      icon: 'time-limit',
    },
    {
      title: 'Duell',
      text: 'Live gegen Freunde oder Zufallsgegner',
      icon: 'lightning-strike',
    },
  ]);

  /** E5: the field grows with the name. */
  protected readonly fieldSize = computed(
    () => Math.max(this.playerName().length, 'Name'.length) + 1,
  );

  constructor() {
    const timer = setInterval(
      () => this.slide.update((value) => (value + 1) % 3),
      SLIDE_INTERVAL_MS,
    );
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    this.playerName.set(this.initialName());
  }

  protected onNameInput(event: Event): void {
    const field = event.target as HTMLInputElement;
    const value = (field.value || '').slice(0, PLAYER_NAME_MAX_LENGTH);
    field.value = value;
    this.playerName.set(value);
    this.errorMessage.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submit();
    }
  }

  protected submit(): void {
    const name = this.cleanName();
    if (!name) {
      this.errorMessage.set('Bitte gib einen Namen ein.');
      return;
    }
    if (this.layout() === 'e-question') {
      this.answered.set(true);
      setTimeout(() => this.startGame.emit(name), ANSWER_FEEDBACK_MS);
      return;
    }
    this.startGame.emit(name);
  }
}
