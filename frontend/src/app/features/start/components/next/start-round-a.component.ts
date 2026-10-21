import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import { PLAYER_NAME_MAX_LENGTH } from '../../../../core/contracts/game.contract';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';
import { LogoMarkComponent } from '../../../../core/ui/logo-mark/logo-mark.component';
import type { StartLayout } from './start-design';

/**
 * TEMPORARY (round 1): proposals for the start page in the design of the lobby
 * facelift. Same data and behaviour as today: a name, then off to the lobby.
 */
@Component({
  selector: 'app-start-round-a',
  imports: [BrandHeaderComponent, LogoMarkComponent, NgTemplateOutlet],
  templateUrl: './start-round-a.component.html',
  styleUrl: './start-round-a.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class StartRoundAComponent implements OnInit {
  readonly layout = input.required<StartLayout>();
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  protected readonly playerName = signal('');
  protected readonly errorMessage = signal('');

  /** The name as it will be used: single spaces, no spaces at the ends. */
  protected readonly cleanName = computed(() =>
    this.playerName().replace(/\s+/g, ' ').trim(),
  );
  protected readonly initial = computed(() =>
    this.cleanName().charAt(0).toUpperCase(),
  );

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
    this.startGame.emit(name);
  }
}
