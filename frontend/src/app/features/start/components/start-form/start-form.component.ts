import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  type OnInit,
  output,
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
  protected playerName = '';
  errorMessage = '';

  ngOnInit(): void {
    this.playerName = this.initialName();
  }

  onNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value || '';

    if (value.length > PLAYER_NAME_MAX_LENGTH) {
      value = value.substring(0, PLAYER_NAME_MAX_LENGTH);
      input.value = value;
    }

    this.playerName = value;
    this.errorMessage = '';
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitForm();
    }
  }

  submitForm() {
    const trimmed = this.playerName.replace(/\s+/g, ' ').trim();
    if (!trimmed) {
      this.errorMessage = 'Bitte gib einen Namen ein.';
      return;
    }

    this.nameSubmitted.emit(trimmed);
  }
}
