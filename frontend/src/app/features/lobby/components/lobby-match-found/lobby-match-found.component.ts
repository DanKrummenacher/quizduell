import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';

@Component({
  selector: 'app-lobby-match-found',
  templateUrl: './lobby-match-found.component.html',
  styleUrl: './lobby-match-found.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyMatchFoundComponent implements OnInit {
  readonly playerName = input.required<string>();
  readonly opponentName = input.required<string>();
  readonly durationMs = input<number>(3000);

  /** Seconds until the first question, counted down locally. */
  protected readonly countdown = signal(3);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly myInitial = computed(() => initialOf(this.playerName()));
  protected readonly opponentInitial = computed(() =>
    initialOf(this.opponentName()),
  );

  ngOnInit(): void {
    this.countdown.set(Math.max(1, Math.ceil(this.durationMs() / 1000)));
    const timer = setInterval(
      () => this.countdown.update((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}
