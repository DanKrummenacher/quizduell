// TEMPORARY: proposal M «Aufgaben», the tasks derived from the data (development only).
import { computed, inject, Injectable, signal } from '@angular/core';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { normalize } from '../pro';
import { ProposalStore, successRate } from '../proposal-store';
import { readJson, writeJson } from '../shared/json-store';

export type TaskKind =
  | 'not-ready'
  | 'rules'
  | 'hard'
  | 'easy'
  | 'duplicate'
  | 'paused'
  | 'never'
  | 'no-category';

export interface Task {
  /** Stable key, so a done task stays done after a reload. */
  key: string;
  kind: TaskKind;
  title: string;
  reason: string;
  /** Lower comes first. */
  priority: number;
  questions: AdminQuestion[];
}

const DONE_KEY = 'playduelio.admin.doneTasks';

export const TASK_LABELS: Record<TaskKind, string> = {
  'not-ready': 'Spielbereitschaft',
  rules: 'Spielregeln',
  hard: 'Zu schwer',
  easy: 'Zu leicht',
  duplicate: 'Doppelt',
  paused: 'Pausiert',
  never: 'Noch nie gestellt',
  'no-category': 'Ohne Kategorie',
};

/**
 * Everything that wants attention, as a list of tasks: the quiz must be
 * playable, questions that are too hard or too easy, duplicates, paused
 * questions to decide on. A task disappears when it is solved, or when it
 * is marked as done.
 */
@Injectable()
export class TaskInbox {
  private readonly store = inject(ProposalStore);
  readonly done = signal<ReadonlySet<string>>(
    new Set(readJson<string[]>(DONE_KEY) ?? []),
  );

  readonly all = computed<Task[]>(() => {
    const questions = this.store.questions() ?? [];
    const stats = this.store.stats();
    const tasks: Task[] = [];
    if (stats && stats.activeQuestions < stats.requiredQuestions) {
      tasks.push({
        key: 'not-ready',
        kind: 'not-ready',
        title: 'Das Quiz ist nicht spielbar',
        reason: `Es braucht mindestens ${stats.requiredQuestions} aktive Fragen, es sind ${stats.activeQuestions}.`,
        priority: 0,
        questions: questions.filter((q) => !q.active),
      });
    }
    if (this.store.dirty()) {
      tasks.push({
        key: 'rules',
        kind: 'rules',
        title: 'Geänderte Spielregeln sind nicht gespeichert',
        reason: 'Die Änderungen gelten erst, wenn sie gespeichert sind.',
        priority: 1,
        questions: [],
      });
    }
    const groups = new Map<string, AdminQuestion[]>();
    for (const q of questions) {
      const k = normalize(q.text);
      groups.set(k, [...(groups.get(k) ?? []), q]);
    }
    for (const group of groups.values()) {
      if (group.length > 1) {
        tasks.push({
          key: `duplicate:${group.map((q) => q.id).join('-')}`,
          kind: 'duplicate',
          title: group[0]!.text,
          reason: `${group.length} Fragen haben denselben Text. Eine davon löschen oder umformulieren.`,
          priority: 2,
          questions: group,
        });
      }
    }
    for (const q of questions) {
      const rate = successRate(q);
      if (q.active && q.timesAsked >= 5 && rate !== null && rate < 20) {
        tasks.push({
          key: `hard:${q.id}`,
          kind: 'hard',
          title: q.text,
          reason: `Nur ${rate} % richtig nach ${q.timesAsked} Antworten. Ist die richtige Antwort korrekt markiert?`,
          priority: 3,
          questions: [q],
        });
      } else if (q.active && q.timesAsked >= 5 && rate !== null && rate > 90) {
        tasks.push({
          key: `easy:${q.id}`,
          kind: 'easy',
          title: q.text,
          reason: `${rate} % richtig nach ${q.timesAsked} Antworten. Vielleicht zu einfach für ein Duell.`,
          priority: 5,
          questions: [q],
        });
      }
      if (!q.active) {
        tasks.push({
          key: `paused:${q.id}`,
          kind: 'paused',
          title: q.text,
          reason: 'Diese Frage ist pausiert. Wieder aktivieren oder löschen?',
          priority: 4,
          questions: [q],
        });
      }
      if (q.active && q.timesAsked === 0) {
        tasks.push({
          key: `never:${q.id}`,
          kind: 'never',
          title: q.text,
          reason:
            'Diese aktive Frage kam noch in keinem Duell. Prüfe sie, bevor die Besucher sie sehen.',
          priority: 6,
          questions: [q],
        });
      }
      if (!q.category) {
        tasks.push({
          key: `no-category:${q.id}`,
          kind: 'no-category',
          title: q.text,
          reason: 'Mit einer Kategorie bleibt der Katalog übersichtlich.',
          priority: 7,
          questions: [q],
        });
      }
    }
    return tasks.sort((a, b) => a.priority - b.priority);
  });

  readonly open = computed(() => this.all().filter((t) => !this.done().has(t.key)));
  readonly closed = computed(() => this.all().filter((t) => this.done().has(t.key)));

  markDone(task: Task): void {
    this.update((set) => set.add(task.key));
  }

  reopen(task: Task): void {
    this.update((set) => set.delete(task.key));
  }

  private update(change: (set: Set<string>) => void): void {
    const next = new Set(this.done());
    change(next);
    this.done.set(next);
    writeJson(DONE_KEY, [...next]);
  }
}
