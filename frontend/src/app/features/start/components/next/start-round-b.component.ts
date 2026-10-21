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
import { StartVisualBComponent } from './start-visual-b.component';

/**
 * TEMPORARY (round 2): proposals for the start page in the design of the lobby
 * facelift. Same data and behaviour as today: a name, then off to the lobby.
 */
@Component({
  selector: 'app-start-round-b',
  imports: [
    BrandHeaderComponent,
    LogoMarkComponent,
    NgTemplateOutlet,
    StartVisualBComponent,
  ],
  templateUrl: './start-round-b.component.html',
  styleUrl: './start-round-b.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'layout()' },
})
export class StartRoundBComponent implements OnInit {
  readonly layout = input.required<StartLayout>();
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  /** N4: sample questions that run by. */
  protected readonly marqueeRows = [
    [
      'Wie viele Kantone hat die Schweiz?',
      'Welcher Planet ist der grösste?',
      'Wer malte die Mona Lisa?',
      'Wie hoch ist das Matterhorn?',
    ],
    [
      'Was ist die Hauptstadt von Kanada?',
      'Wie viele Beine hat eine Spinne?',
      'Welches Element hat das Zeichen O?',
      'In welchem Jahr fiel die Berliner Mauer?',
    ],
  ];
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
