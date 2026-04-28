import {
  Component,
  input,
  signal,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/calc-ui-icon';

@Component({
  selector: 'app-lobby-match-found',
  templateUrl: './lobby-match-found.component.html',
  styleUrl: './lobby-match-found.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyMatchFoundComponent implements OnInit, OnDestroy {
  readonly opponentName = input.required<string>();

  countdown = signal<number>(3);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.countdown.update((c) => Math.max(0, c - 1));
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
