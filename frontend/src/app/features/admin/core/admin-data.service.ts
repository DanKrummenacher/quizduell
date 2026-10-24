import { computed, inject, Injectable, signal } from '@angular/core';
import type {
  AdminQuestion,
  LiveSnapshot,
} from '../../../core/contracts/admin.contract';
import { AdminApi } from './admin-api.service';
import { remote } from './remote';

export interface QuizStatus {
  tone: 'ok' | 'warn' | 'down';
  label: string;
  detail?: string;
}

/**
 * Data several admin pages share, loaded once per sign-in: the questions, the
 * hints and the rules. Pages change it through the API and then update or
 * reload it here, so every page shows the same state.
 */
@Injectable()
export class AdminData {
  private readonly api = inject(AdminApi);

  readonly questions = remote(() => this.api.questions());
  readonly hints = remote(() => this.api.hints());
  readonly settings = remote(() => this.api.settings());
  /** The latest live snapshot, from the live page or the shell's slower poll. */
  readonly live = signal<LiveSnapshot | null>(null);
  /** False when the last live request failed: the game server is not reachable. */
  readonly reachable = signal(true);

  readonly openHints = computed(
    () => this.hints.value()?.filter((hint) => !hint.ignored) ?? null,
  );

  readonly categories = computed(() => {
    const names = new Set<string>();
    for (const question of this.questions.value() ?? []) {
      if (question.category) {
        names.add(question.category);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'de-CH'));
  });

  questionById(id: number | null): AdminQuestion | null {
    return id === null
      ? null
      : (this.questions.value()?.find((question) => question.id === id) ?? null);
  }

  /** Replaces one question after a change and re-evaluates the hints. */
  replaceQuestion(question: AdminQuestion): void {
    this.questions.update((all) =>
      all.some((q) => q.id === question.id)
        ? all.map((q) => (q.id === question.id ? question : q))
        : [...all, question],
    );
    void this.hints.reload();
  }

  removeQuestions(ids: readonly number[]): void {
    const gone = new Set(ids);
    this.questions.update((all) => all.filter((q) => !gone.has(q.id)));
    void this.hints.reload();
  }

  /** After bulk changes and imports: everything from the server. */
  async reloadQuestions(): Promise<void> {
    await Promise.all([this.questions.reload(), this.hints.reload()]);
  }

  async refreshLive(): Promise<void> {
    try {
      this.live.set(await this.api.live());
      this.reachable.set(true);
    } catch {
      this.reachable.set(false);
    }
  }

  /** Can people play right now, in one word for the header and overview. */
  readonly status = computed<QuizStatus>(() => {
    if (!this.reachable()) {
      return { tone: 'down', label: 'Server nicht erreichbar' };
    }
    if (this.playable() === false) {
      return { tone: 'warn', label: 'Zu wenige Fragen' };
    }
    const running =
      this.live()?.duels.filter((d) => d.phase !== 'finished').length ?? 0;
    return {
      tone: 'ok',
      label: 'Quiz ist online',
      detail:
        running === 0
          ? 'gerade kein Duell'
          : running === 1
            ? '1 Duell läuft'
            : `${running} Duelle laufen`,
    };
  });

  /** Whether the active questions suffice for a duel with the current rules. */
  readonly playable = computed(() => {
    const questions = this.questions.value();
    const settings = this.settings.value();
    if (!questions || !settings) {
      return null;
    }
    return (
      questions.filter((q) => q.active).length >= settings.settings.questionsPerGame
    );
  });
}
