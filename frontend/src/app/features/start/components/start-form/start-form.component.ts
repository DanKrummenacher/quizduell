import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import '@css-ch/calc-ui-text';
import { PLAYER_NAME_MAX_LENGTH } from '../../../../core/contracts/game.contract';

@Component({
  selector: 'app-start-form',
  templateUrl: './start-form.component.html',
  styleUrl: './start-form.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StartFormComponent implements OnInit {
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly nameSubmitted = output<string>();

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  protected readonly playerName = signal('');
  protected readonly errorMessage = signal('');

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
      this.submitForm();
    }
  }

  protected submitForm(): void {
    const name = this.playerName().replace(/\s+/g, ' ').trim();
    if (!name) {
      this.errorMessage.set('Bitte gib einen Namen ein.');
      return;
    }
    this.nameSubmitted.emit(name);
  }
}
