import { Component, input } from '@angular/core';
import type { PlayerResultView } from '../../result.types';

@Component({
  selector: 'app-result-players',
  templateUrl: './result-players.component.html',
  styleUrl: './result-players.component.scss',
})
export class ResultPlayersComponent {
  readonly players = input.required<PlayerResultView[]>();

  protected initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}
