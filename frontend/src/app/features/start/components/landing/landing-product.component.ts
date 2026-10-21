import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';
import { LandingPhoneComponent } from './landing-phone.component';

/**
 * TEMPORARY (landing concepts) · L1 Produkt: a large headline, the name
 * field right below, the real game on a phone; then how it works.
 */
@Component({
  selector: 'app-landing-product',
  imports: [LandingNavComponent, LandingNameFormComponent, LandingPhoneComponent],
  templateUrl: './landing-product.component.html',
  styleUrl: './landing-product.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandingProductComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly name = signal('');
  protected readonly initial = computed(() =>
    this.name().trim().charAt(0).toUpperCase(),
  );
}
