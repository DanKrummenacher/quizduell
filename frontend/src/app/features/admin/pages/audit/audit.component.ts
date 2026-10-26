import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import '@css-ch/components/icon';
import type {
  AdminSettings,
  AuditAction,
  AuditEntry,
} from '../../../../core/contracts/admin.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { ConfirmService } from '../../core/confirm.service';
import { dayKey, formatLongDay, formatTime } from '../../core/format';
import { NotifyService } from '../../core/notify.service';
import { formatSetting, SETTINGS_META } from '../../core/settings-meta';
import { AdStateComponent } from '../../ui/state.component';
import { messageOf } from '../questions/questions.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';

type Group = 'all' | 'settings' | 'game' | 'questions' | 'hints' | 'login';

const GROUPS: { id: Group; label: string; actions: AuditAction[] | null }[] = [
  { id: 'all', label: 'Alle', actions: null },
  {
    id: 'settings',
    label: 'Spielregeln',
    actions: ['settings.update', 'settings.restore'],
  },
  { id: 'game', label: 'Spielbetrieb', actions: ['game.pause', 'game.resume'] },
  {
    id: 'questions',
    label: 'Fragen',
    actions: [
      'question.create',
      'question.update',
      'question.delete',
      'question.restore',
      'trash.purge',
      'questions.bulk',
      'questions.import',
    ],
  },
  { id: 'hints', label: 'Hinweise', actions: ['hint.ignore', 'hint.restore'] },
  { id: 'login', label: 'Anmeldungen', actions: ['login'] },
];

const ICONS: Record<AuditAction, string> = {
  login: 'unlock',
  'settings.update': 'settings',
  'settings.restore': 'undo',
  'game.pause': 'pause-circle',
  'game.resume': 'play-circle',
  'question.create': 'add',
  'question.update': 'edit',
  'question.delete': 'trash',
  'question.restore': 'undo',
  'trash.purge': 'trash',
  'questions.bulk': 'items-list',
  'questions.import': 'upload',
  'hint.ignore': 'hide',
  'hint.restore': 'view',
};

/** Everything that was changed in the admin, with earlier rules to restore. */
@Component({
  selector: 'app-admin-audit',
  imports: [AdPageHeadComponent, AdStateComponent],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AuditComponent {
  private readonly api = inject(AdminApi);
  private readonly data = inject(AdminData);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotifyService);

  protected readonly groups = GROUPS;
  protected readonly icons = ICONS;
  protected timeOf(at: string): string {
    return formatTime(Date.parse(at));
  }

  protected readonly entries = signal<AuditEntry[]>([]);
  protected readonly cursor = signal<number | null>(null);
  protected readonly loaded = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly group = signal<Group>('all');
  protected readonly restoring = signal<number | null>(null);
  protected readonly query = signal('');

  /** How many loaded entries each filter shows. */
  protected readonly counts = computed(() => {
    const counts: Record<Group, number> = {
      all: 0,
      settings: 0,
      game: 0,
      questions: 0,
      hints: 0,
      login: 0,
    };
    for (const entry of this.entries()) {
      counts.all++;
      const group = GROUPS.find((g) => g.actions?.includes(entry.action));
      if (group) {
        counts[group.id]++;
      }
    }
    return counts;
  });

  protected readonly groupLabel = computed(
    () => GROUPS.find((g) => g.id === this.group())?.label ?? '',
  );

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected showAll(): void {
    this.group.set('all');
    this.query.set('');
  }

  constructor() {
    // «Im Verlauf ansehen» elsewhere opens the log on its group.
    const wanted = inject(ActivatedRoute).snapshot.queryParamMap.get('gruppe');
    const group = GROUPS.find((g) => g.label.toLowerCase() === wanted);
    if (group) {
      this.group.set(group.id);
    }
    void this.load(true);
  }

  protected async load(fresh = false): Promise<void> {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const page = await this.api.audit(
        fresh ? undefined : (this.cursor() ?? undefined),
        100,
      );
      this.entries.update((entries) =>
        fresh ? page.entries : [...entries, ...page.entries],
      );
      this.cursor.set(page.nextCursor);
      this.loaded.set(true);
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected readonly days = computed(() => {
    const actions = GROUPS.find((g) => g.id === this.group())?.actions ?? null;
    const needle = this.query().trim().toLowerCase();
    const visible = this.entries().filter(
      (entry) =>
        (!actions || actions.includes(entry.action)) &&
        (!needle || entry.summary.toLowerCase().includes(needle)),
    );
    const days: {
      key: string;
      label: string;
      entries: ReturnType<typeof toView>[];
    }[] = [];
    const today = dayKey(new Date());
    const yesterday = dayKey(new Date(Date.now() - 86_400_000));
    for (const entry of visible) {
      const key = dayKey(new Date(entry.at));
      let day = days.at(-1);
      if (day?.key !== key) {
        day = {
          key,
          label:
            key === today
              ? 'Heute'
              : key === yesterday
                ? 'Gestern'
                : formatLongDay(key),
          entries: [],
        };
        days.push(day);
      }
      day.entries.push(toView(entry));
    }
    return days.map((day) => ({
      ...day,
      count:
        day.entries.length === 1 ? '1 Änderung' : `${day.entries.length} Änderungen`,
      weekday: formatLongDay(day.key),
    }));
  });

  protected async restore(entry: AuditEntry): Promise<void> {
    if (!entry.before) {
      return;
    }
    const current = this.data.settings.value()?.settings;
    const diff = current ? describeDiff(current, entry.before) : [];
    if (current && diff.length === 0) {
      this.notify.success('Die Spielregeln sind schon so eingestellt');
      return;
    }
    const sure = await this.confirm.ask({
      title: 'Frühere Spielregeln wiederherstellen?',
      text: `${diff.join(', ')}. Gilt ab dem nächsten Duell.`,
      confirm: 'Wiederherstellen',
    });
    if (!sure) {
      return;
    }
    this.restoring.set(entry.id);
    try {
      const view = await this.api.restoreSettings(entry.id);
      this.data.settings.set(view);
      this.notify.success('Spielregeln wiederhergestellt');
      await this.load(true);
    } catch (error) {
      this.notify.error(messageOf(error));
    } finally {
      this.restoring.set(null);
    }
  }
}

function describeDiff(from: AdminSettings, to: AdminSettings): string[] {
  return SETTINGS_META.filter((meta) => from[meta.key] !== to[meta.key]).map(
    (meta) =>
      `${meta.label} ${formatSetting(meta.key, from[meta.key])} → ${formatSetting(meta.key, to[meta.key])}`,
  );
}

function toView(entry: AuditEntry) {
  const changes =
    entry.before && entry.after
      ? SETTINGS_META.filter(
          (meta) => entry.before![meta.key] !== entry.after![meta.key],
        ).map((meta) => ({
          label: meta.label,
          before: formatSetting(meta.key, entry.before![meta.key]),
          after: formatSetting(meta.key, entry.after![meta.key]),
        }))
      : [];
  return {
    entry,
    changes,
    // Settings entries list the changes themselves; the summary repeats them.
    title: changes.length
      ? entry.action === 'settings.restore'
        ? 'Frühere Spielregeln wiederhergestellt'
        : 'Spielregeln geändert'
      : entry.summary,
  };
}
