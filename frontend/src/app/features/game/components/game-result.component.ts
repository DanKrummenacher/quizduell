import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { GameStateView } from '../../../core/contracts/game.contract';
import { initial } from '../game.models';

type Outcome = 'win' | 'loss' | 'draw';

/** Final result with rematch (friend games) or a new quick game. */
@Component({
  selector: 'app-game-result',
  templateUrl: './game-result.component.html',
  styleUrl: './game-result.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameResultComponent {
  readonly state = input.required<GameStateView>();
  readonly remainingMs = input.required<number>();
  readonly busy = input(false);
  readonly rematch = output<void>();
  readonly playAgain = output<void>();
  readonly menu = output<void>();

  protected readonly outcome = computed<Outcome>(() => {
    const { you, opponent } = this.state();
    const opponentScore = opponent?.score ?? 0;
    if (you.score > opponentScore) {
      return 'win';
    }
    return you.score < opponentScore ? 'loss' : 'draw';
  });

  protected readonly heading = computed(() => {
    switch (this.outcome()) {
      case 'win':
        return {
          title: 'Gewonnen!',
          text: 'Stark gespielt – du warst schneller im Kopf.',
          icon: 'trophy',
        };
      case 'loss':
        return {
          title: 'Knapp daneben',
          text: 'Kopf hoch – die Revanche gehört dir!',
          icon: 'lightning-strike',
        };
      default:
        return {
          title: 'Unentschieden',
          text: 'Ihr wart exakt gleich gut.',
          icon: 'handshake',
        };
    }
  });

  protected readonly players = computed(() => {
    const { you, opponent } = this.state();
    const rows = [
      { name: you.name, score: you.score, isYou: true, initial: initial(you.name) },
      ...(opponent
        ? [
            {
              name: opponent.name,
              score: opponent.score,
              isYou: false,
              initial: initial(opponent.name),
            },
          ]
        : []),
    ];
    return rows.sort((a, b) => b.score - a.score || (a.isYou ? -1 : 1));
  });

  protected readonly isFriendGame = computed(() => this.state().mode === 'friend');
  protected readonly rematchSeconds = computed(() =>
    Math.ceil(this.remainingMs() / 1000),
  );

  protected readonly rematchStatus = computed(() => {
    const { you, opponent, endReason, rematchAvailable } = this.state();
    const name = opponent?.name ?? 'Dein Gegner';
    if (endReason === 'opponent-left' || endReason === 'opponent-disconnected') {
      return { text: `${name} hat das Spiel verlassen.`, tone: 'muted' as const };
    }
    if (endReason === 'rematch-declined' || !rematchAvailable) {
      return {
        text: 'Keine Revanche – die Zeit ist abgelaufen.',
        tone: 'muted' as const,
      };
    }
    if (you.rematchRequested) {
      return { text: `Warte auf ${name} …`, tone: 'info' as const };
    }
    if (opponent?.rematchRequested) {
      return { text: `${name} will eine Revanche!`, tone: 'highlight' as const };
    }
    return null;
  });
}
