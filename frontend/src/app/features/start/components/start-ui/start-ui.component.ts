import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  output,
} from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/components/icon';
import { NgTemplateOutlet } from '@angular/common';
import { BrandingStore } from '../../../../core/branding/branding.store';
import { LogoMarkComponent } from '../../../../core/ui/logo-mark/logo-mark.component';
import { StartFormComponent } from '../start-form/start-form.component';
import { StartHeaderComponent } from '../start-header/start-header.component';

@Component({
  selector: 'app-start-ui',
  imports: [
    StartHeaderComponent,
    StartFormComponent,
    LogoMarkComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './start-ui.component.html',
  styleUrl: './start-ui.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': "'concept-' + variant()" },
})
export class StartUiComponent {
  readonly features = input.required<{ icon: string; text: string }[]>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);

  readonly startGame = output<string>();

  protected readonly variant = inject(BrandingStore).header;

  onNameSubmitted(name: string) {
    this.startGame.emit(name);
  }
}
