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
import { shapeRing } from '../../../../core/branding/logo-shapes';
import { PLAYER_NAME_MAX_LENGTH } from '../../../../core/contracts/game.contract';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';

/**
 * TEMPORARY: «pure» is the facelift of today's start page; the others add
 * motion on top of the very same page.
 */
export type StartFaceliftVariant = 'pure' | 'intro' | 'logo' | 'live' | 'shapes';

/**
 * The start page in the design system of the lobby: the same content as
 * before (title, three facts, name, start), with its type scale, symbols
 * and spacing.
 */
@Component({
  selector: 'app-start-facelift',
  imports: [BrandHeaderComponent],
  templateUrl: './start-facelift.component.html',
  styleUrl: './start-facelift.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': "'is-' + variant()" },
})
export class StartFaceliftComponent implements OnInit {
  readonly features = input.required<{ icon: string; text: string }[]>();
  readonly seconds = input(20);
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly variant = input<StartFaceliftVariant>('pure');
  readonly startGame = output<string>();

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  protected readonly ring = shapeRing();
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
      this.submit();
    }
  }

  protected submit(): void {
    const name = this.playerName().replace(/\s+/g, ' ').trim();
    if (!name) {
      this.errorMessage.set('Bitte gib einen Namen ein.');
      return;
    }
    this.startGame.emit(name);
  }
}
