import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { StartHeaderComponent } from '../start-header/start-header.component';
import { StartFormComponent } from '../start-form/start-form.component';
import '@css-ch/calc-ui-text';
import '@css-ch/calc-ui-icon';

@Component({
  selector: 'app-start-ui',
  imports: [StartHeaderComponent, StartFormComponent],
  templateUrl: './start-ui.component.html',
  styleUrl: './start-ui.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StartUiComponent {
  readonly features = input.required<{ icon: string; text: string }[]>();

  readonly startGame = output<string>();

  onNameSubmitted(name: string) {
    this.startGame.emit(name);
  }
}
