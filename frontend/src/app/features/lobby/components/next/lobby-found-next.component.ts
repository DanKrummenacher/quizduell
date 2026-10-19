import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import type { LobbyDesign } from './lobby-design';

@Component({
  selector: 'app-lobby-found-next',
  template: `
    <div class="screen-content" role="status">
      @if (design() === 'facelift') {
        <span class="symbol" aria-hidden="true">
          <css-icon icon="checkmark-circle" size="lg"></css-icon>
        </span>
        <h1 class="title spaced">Gegner gefunden!</h1>
        <p class="subtitle">
          Dein Gegner: <strong class="opponent-name">{{ opponentName() }}</strong>
        </p>
        <p class="starts">
          @if (countdown() > 0) {
            Das Duell beginnt in {{ countdown() }}&nbsp;s
          } @else {
            Los geht’s!
          }
        </p>
      } @else {
        <h1 class="title">Gegner gefunden!</h1>
        <p class="subtitle">Das Duell beginnt gleich.</p>
        <div class="faceoff">
          <div class="side">
            <span class="avatar large" aria-hidden="true">{{
              initial(playerName())
            }}</span>
            <span class="side-name">{{ playerName() }} (Du)</span>
          </div>
          <span class="clock" aria-hidden="true">
            <span class="clock-value">{{
              countdown() > 0 ? countdown() : 'Los'
            }}</span>
          </span>
          <div class="side">
            <span class="avatar large is-opponent" aria-hidden="true">{{
              initial(opponentName())
            }}</span>
            <span class="side-name opponent-name">{{ opponentName() }}</span>
          </div>
        </div>
        <p class="visually-hidden">
          Das Duell beginnt in {{ countdown() }} Sekunden.
        </p>
      }
    </div>
  `,
  styleUrl: './lobby-screen.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyFoundNextComponent implements OnInit {
  readonly design = input.required<LobbyDesign>();
  readonly playerName = input.required<string>();
  readonly opponentName = input.required<string>();
  readonly durationMs = input<number>(3000);

  /** Seconds until the first question, counted down locally. */
  protected readonly countdown = signal(3);
  private readonly destroyRef = inject(DestroyRef);

  protected initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    this.countdown.set(Math.max(1, Math.ceil(this.durationMs() / 1000)));
    const timer = setInterval(
      () => this.countdown.update((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }
}
