import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { PLAYER_NAME_MAX_LENGTH } from '../../../../core/contracts/game.contract';

/**
 * TEMPORARY (landing concepts): the name field with the start button inside,
 * as on product pages. Light or dark.
 */
@Component({
  selector: 'app-landing-name-form',
  templateUrl: './landing-name-form.component.html',
  styleUrl: './landing-name-form.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class.is-dark]': 'dark()' },
})
export class LandingNameFormComponent implements OnInit {
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly dark = input(false);
  /** Several forms can be on one page; each needs its own id. */
  readonly fieldId = input('playerName');
  readonly startGame = output<string>();
  readonly nameChange = output<string>();

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  protected readonly playerName = signal('');
  protected readonly errorMessage = signal('');
  protected readonly messageId = computed(() => `${this.fieldId()}Message`);

  ngOnInit(): void {
    this.playerName.set(this.initialName());
    this.nameChange.emit(this.initialName());
  }

  protected onNameInput(event: Event): void {
    const field = event.target as HTMLInputElement;
    const value = (field.value || '').slice(0, PLAYER_NAME_MAX_LENGTH);
    field.value = value;
    this.playerName.set(value);
    this.errorMessage.set('');
    this.nameChange.emit(value);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const name = this.playerName().replace(/\s+/g, ' ').trim();
    if (!name) {
      this.errorMessage.set('Bitte gib einen Namen ein.');
      return;
    }
    this.startGame.emit(name);
  }
}
