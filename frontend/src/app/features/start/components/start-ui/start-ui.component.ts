import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/components/icon';
import { StartFormComponent } from '../start-form/start-form.component';
import { StartHeaderComponent } from '../start-header/start-header.component';

@Component({
  selector: 'app-start-ui',
  imports: [StartHeaderComponent, StartFormComponent],
  templateUrl: './start-ui.component.html',
  styleUrl: './start-ui.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StartUiComponent {
  readonly features = input.required<{ icon: string; text: string }[]>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);

  readonly startGame = output<string>();

  onNameSubmitted(name: string) {
    this.startGame.emit(name);
  }
}
