import { Component, input, output } from '@angular/core';
import { ChoiceCardComponent } from './choice-card.component';
import { JoinFormComponent } from './join-form.component';
import type { LobbyDesign } from './lobby-design';

@Component({
  selector: 'app-lobby-mode-next',
  imports: [ChoiceCardComponent, JoinFormComponent],
  template: `
    <div class="screen-content">
      <h1 class="title">Hallo {{ playerName() }}</h1>
      <p class="subtitle">Wie möchtest du spielen?</p>

      <div class="choices">
        <app-choice-card
          icon="lightning-strike"
          heading="Schnellspiel 1vs1"
          description="Gegen einen zufälligen Gegner"
          (choose)="selectQuickGame.emit()"
        />

        @if (design() === 'flow') {
          <app-choice-card
            icon="add"
            heading="Spiel erstellen"
            description="Code erhalten und mit einem Freund teilen"
            (choose)="createGame.emit()"
          />
        } @else {
          <app-choice-card
            icon="conference"
            heading="Freund herausfordern"
            description="Spiel erstellen oder mit Code beitreten"
            (choose)="selectFriendGame.emit()"
          />
        }
      </div>

      @if (design() === 'flow') {
        <div class="join">
          <p class="join-title">Hast du einen Code bekommen?</p>
          <app-join-form
            label="Code eingeben"
            [joinError]="joinError()"
            (joinGame)="joinGame.emit($event)"
          />
        </div>
      }
    </div>
  `,
  styleUrl: './lobby-screen.scss',
})
export class LobbyModeNextComponent {
  readonly design = input.required<LobbyDesign>();
  readonly playerName = input.required<string>();
  readonly joinError = input<string>('');

  readonly selectQuickGame = output<void>();
  readonly selectFriendGame = output<void>();
  readonly createGame = output<void>();
  readonly joinGame = output<string>();
}
