// TEMPORARY: proposal F «Stand-Check» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-stepper';
import '@css-ch/components/switch';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import {
  formatDuration,
  type NumericKey,
  ProposalStore,
  successRate,
} from '../proposal-store';
import { DuelTimelineComponent } from '../shared/duel-timeline.component';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';
import { RoundEditorComponent } from './round-editor.component';

type StepKey = 'questions' | 'rules' | 'devices' | 'live';

/**
 * The admin as a guided check before and during the fair: four steps, each
 * with a clear state. The ring at the top shows how ready the stand is; the
 * first open step is unfolded. A round of the duel is set by dragging.
 */
@Component({
  selector: 'app-check',
  imports: [
    LogoMarkComponent,
    ProposalDialogsComponent,
    RoundEditorComponent,
    DuelTimelineComponent,
  ],
  templateUrl: './check.component.html',
  styleUrl: './check.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CheckComponent {
  protected readonly store = inject(ProposalStore);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly rate = successRate;
  protected readonly duration = formatDuration;
  protected readonly openCategory = signal<string | null>(null);

  protected readonly steps = computed<
    { key: StepKey; title: string; done: boolean; summary: string; todo: string }[]
  >(() => {
    const s = this.store.stats();
    const f = this.store.form();
    return [
      {
        key: 'questions',
        title: 'Fragen',
        done: this.store.ready() === true,
        summary: s
          ? `${s.activeQuestions} aktive Fragen in ${this.store.categoryStats().length} Kategorien`
          : '…',
        todo: `Es fehlen noch ${this.store.missingQuestions()} aktive Fragen.`,
      },
      {
        key: 'rules',
        title: 'Spielregeln',
        done: !!f && !this.store.dirty(),
        summary: f
          ? `${f.questionsPerGame} Fragen à ${f.questionDurationSec} s · max. ${formatDuration(this.store.gameSeconds())}`
          : '…',
        todo: 'Änderungen sind noch nicht gespeichert.',
      },
      {
        key: 'devices',
        title: 'Geräte am Stand',
        done: !!f && f.idleResetSec > 0,
        summary:
          f && f.idleResetSec > 0
            ? `Zurück zum Start nach ${f.idleResetSec} s ohne Bedienung`
            : '…',
        todo: 'Geräte bleiben stehen, wenn jemand mitten im Spiel geht.',
      },
      {
        key: 'live',
        title: 'Live',
        done: !!s && !this.store.statsError(),
        summary: s
          ? `${s.playersOnline} Geräte verbunden · ${s.activeGames} Duelle laufen`
          : '…',
        todo: 'Der Server ist nicht erreichbar.',
      },
    ];
  });

  protected readonly doneCount = computed(
    () => this.steps().filter((s) => s.done).length,
  );
  /** The first open step unfolds; the user can open any other. */
  private readonly firstOpen = computed(
    () => this.steps().find((s) => !s.done)?.key ?? null,
  );
  protected readonly open = linkedSignal<StepKey | null>(() => this.firstOpen());

  protected readonly ring = computed(() => {
    const circumference = 2 * Math.PI * 52;
    return {
      circumference,
      offset: circumference * (1 - this.doneCount() / this.steps().length),
    };
  });

  protected readonly groups = computed(() =>
    this.store.categoryStats().map((category) => ({
      ...category,
      questions: (this.store.questions() ?? []).filter(
        (q) => (q.category ?? '') === category.name,
      ),
    })),
  );

  protected toggleStep(key: StepKey): void {
    this.open.set(this.open() === key ? null : key);
  }

  protected async setGroup(questions: AdminQuestion[], event: Event): Promise<void> {
    const active = eventChecked(event);
    for (const question of questions.filter((q) => q.active !== active)) {
      await this.store.setActive(question, active);
    }
  }

  protected toggle(question: AdminQuestion, event: Event): void {
    void this.store.setActive(question, eventChecked(event));
  }

  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }

  protected setBonus(event: Event): void {
    this.store.setSpeedBonus(eventChecked(event));
  }
}
