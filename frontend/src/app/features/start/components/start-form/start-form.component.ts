import { Component, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-button';
import '@css-ch/calc-ui-icon';
import '@css-ch/calc-ui-input-text';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-start-form',
  templateUrl: './start-form.component.html',
  styleUrl: './start-form.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StartFormComponent {
  readonly nameSubmitted = output<string>();

  private playerName = '';
  errorMessage = '';

  onNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value || '';

    if (value.length > 30) {
      value = value.substring(0, 30);
      input.value = value;
    }

    this.playerName = value;
    this.errorMessage = '';
  }

  submitForm() {
    const trimmed = this.playerName.trim();
    if (!trimmed) {
      this.errorMessage = 'Bitte gib einen Namen ein.';
      return;
    }

    if (trimmed.length > 30) {
      this.errorMessage = 'Der Name darf maximal 30 Zeichen lang sein.';
      return;
    }

    this.nameSubmitted.emit(trimmed);
  }
}
