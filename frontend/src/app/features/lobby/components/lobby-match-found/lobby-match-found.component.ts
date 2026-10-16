import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
} from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/components/icon';

@Component({
  selector: 'app-lobby-match-found',
  templateUrl: './lobby-match-found.component.html',
  styleUrl: './lobby-match-found.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyMatchFoundComponent implements OnInit {
  readonly opponentName = input.required<string>();
  readonly durationMs = input<number>(3000);

  /** Seconds until the first question, counted down locally. */
  protected readonly countdown = signal(3);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.countdown.set(Math.max(1, Math.ceil(this.durationMs() / 1000)));
    const timer = setInterval(
      () => this.countdown.update((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }
}
