import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  inject,
  type OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import '@css-ch/components/spinner';
import { errorMessage } from '../../core/game/error-messages';
import { GameClient } from '../../core/game/game-client.service';
import { IdleResetService } from '../../core/platform/idle-reset.service';
import { WakeLockService } from '../../core/platform/wake-lock.service';
import { PlayerNameStore } from '../../core/player/player-name.store';
import { ConnectionBannerComponent } from '../../core/ui/connection-banner/connection-banner.component';
import { PageComponent } from '../../core/ui/page/page.component';
import { GameAbortedComponent } from './components/game-aborted.component';
import { GameCountdownComponent } from './components/game-countdown.component';
import { GameQuizComponent } from './components/game-quiz.component';
import { GameResultComponent } from './components/game-result.component';
import { GameWaitingComponent } from './components/game-waiting.component';

const RUNNING_PHASES = new Set(['countdown', 'question', 'reveal']);

@Component({
  selector: 'app-game-page',
  imports: [
    PageComponent,
    ConnectionBannerComponent,
    GameWaitingComponent,
    GameCountdownComponent,
    GameQuizComponent,
    GameResultComponent,
    GameAbortedComponent,
  ],
  templateUrl: './game.page.html',
  styleUrl: './game.page.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GamePage implements OnDestroy {
  private readonly router = inject(Router);
  private readonly gameClient = inject(GameClient);
  private readonly wakeLock = inject(WakeLockService);
  private readonly idleReset = inject(IdleResetService);
  private readonly playerName = inject(PlayerNameStore);

  protected readonly state = this.gameClient.state;
  protected readonly resuming = this.gameClient.resuming;
  protected readonly selectedIndex = signal<number | null>(null);
  protected readonly actionError = signal('');
  protected readonly rematchBusy = signal(false);
  protected readonly confirmLeave = signal(false);
  /** True for the countdown that follows a finished game (rematch). */
  protected readonly isRematch = signal(false);

  private readonly now = signal(this.gameClient.serverNow());
  protected readonly remainingMs = computed(() => {
    const endsAt = this.state()?.phaseEndsAt;
    return endsAt ? Math.max(0, endsAt - this.now()) : 0;
  });
  protected readonly running = computed(() =>
    RUNNING_PHASES.has(this.state()?.phase ?? ''),
  );

  constructor() {
    const ticker = setInterval(() => this.now.set(this.gameClient.serverNow()), 100);
    inject(DestroyRef).onDestroy(() => clearInterval(ticker));
    void this.wakeLock.enable();

    // No game (and none to resume): back to the lobby.
    effect(() => {
      if (!this.state() && !this.resuming()) {
        void this.router.navigate([this.playerName.name() ? '/lobby' : '/']);
      }
    });

    // Forget the local answer whenever a new question starts.
    let lastQuestion: number | null = null;
    effect(() => {
      const state = this.state();
      const questionIndex =
        state?.phase === 'question' ? (state.question?.index ?? null) : null;
      if (questionIndex !== lastQuestion) {
        lastQuestion = questionIndex;
        untracked(() => {
          this.selectedIndex.set(null);
          this.actionError.set('');
        });
      }
    });

    let previousPhase: string | undefined;
    effect(() => {
      const phase = this.state()?.phase;
      if (phase !== previousPhase) {
        if (phase === 'countdown') {
          untracked(() => this.isRematch.set(previousPhase === 'finished'));
        }
        previousPhase = phase;
      }
    });

    // Stand mode reset only on the final screens, never during a duel.
    effect(() => {
      const phase = this.state()?.phase;
      if (phase === 'finished' || phase === 'aborted') {
        this.idleReset.arm();
      } else {
        this.idleReset.disarm();
      }
    });

    effect(() => {
      if (!this.running()) {
        untracked(() => this.confirmLeave.set(false));
      }
    });
  }

  ngOnDestroy(): void {
    void this.wakeLock.disable();
    this.idleReset.disarm();
  }

  protected async answer(index: number): Promise<void> {
    const state = this.state();
    if (!state?.question || this.selectedIndex() !== null) {
      return;
    }
    this.selectedIndex.set(index);
    const result = await this.gameClient.submitAnswer(state.question.index, index);
    if (!result.ok) {
      this.actionError.set(errorMessage(result.error));
    }
  }

  protected async rematch(): Promise<void> {
    this.rematchBusy.set(true);
    const result = await this.gameClient.requestRematch();
    this.rematchBusy.set(false);
    if (!result.ok) {
      this.actionError.set(errorMessage(result.error));
    }
  }

  protected playAgain(): void {
    this.gameClient.leave();
    void this.router.navigate(['/lobby'], { state: { autoStart: 'quick' } });
  }

  protected toMenu(): void {
    this.gameClient.leave();
    void this.router.navigate(['/lobby']);
  }

  protected requestLeave(): void {
    if (this.running()) {
      this.confirmLeave.set(true);
    } else {
      this.toMenu();
    }
  }
}
