import { Component, input, output } from '@angular/core';
import { ChoiceCardComponent } from './choice-card.component';
import { JoinFormComponent } from './join-form.component';

@Component({
  selector: 'app-lobby-actions-next',
  imports: [ChoiceCardComponent, JoinFormComponent],
  template: `
    <div class="screen-content">
      <h1 class="title">Freund herausfordern</h1>
      <p class="subtitle">Erstelle ein Spiel oder tritt mit einem Code bei.</p>

      <div class="choices">
        <app-choice-card
          icon="add"
          heading="Spiel erstellen"
          description="Code erhalten und mit einem Freund teilen"
          (choose)="createGame.emit()"
        />
      </div>

      <div class="join">
        <p class="join-title">Mit Code beitreten</p>
        <app-join-form
          label="Code deines Gegners"
          [joinError]="joinError()"
          (joinGame)="joinGame.emit($event)"
        />
      </div>
    </div>
  `,
  styleUrl: './lobby-screen.scss',
})
export class LobbyActionsNextComponent {
  readonly joinError = input<string>('');
  readonly createGame = output<void>();
  readonly joinGame = output<string>();
}
