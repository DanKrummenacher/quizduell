import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-stepper';
import '@css-ch/calc-ui-text';
import '@css-ch/components/spinner';
import '@css-ch/components/switch';
import type {
  AdminSettings,
  AdminSettingsResponse,
  SettingsLimit,
} from '../../core/contracts/admin.contract';
import { eventChecked, eventText } from '../../core/ui/component-events';
import { AdminApi } from '../admin-api.service';
import type { AdminMessage } from '../admin-message';

/** Countdown before the first question, see the game engine. */
const COUNTDOWN_SEC = 3;

type NumericKey = Exclude<keyof AdminSettings, 'speedBonusEnabled'>;

interface NumericField {
  key: NumericKey;
  label: string;
  hint: string;
}

const FIELDS: NumericField[] = [
  {
    key: 'questionsPerGame',
    label: 'Fragen pro Duell',
    hint: 'Wie viele Fragen ein Duell hat.',
  },
  {
    key: 'questionDurationSec',
    label: 'Sekunden pro Frage',
    hint: 'Zeit, um eine Frage zu beantworten.',
  },
  {
    key: 'revealDurationSec',
    label: 'Sekunden für die Auflösung',
    hint: 'Wie lange die richtige Antwort angezeigt wird.',
  },
  {
    key: 'rematchTimeoutSec',
    label: 'Sekunden für die Revanche',
    hint: 'Zeit zum Fordern einer Revanche; nach einer Anfrage beginnt sie für die Antwort neu.',
  },
  {
    key: 'idleResetSec',
    label: 'Stand-Modus: Zurücksetzen nach Sekunden',
    hint: 'Stand-Geräte springen nach dieser Zeit ohne Bedienung zur Startseite zurück. 0 = aus.',
  },
];

@Component({
  selector: 'app-admin-settings-page',
  templateUrl: './admin-settings.page.html',
  styleUrl: './admin-settings.page.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminSettingsPage {
  private readonly api = inject(AdminApi);

  protected readonly fields = FIELDS;
  protected readonly response = signal<AdminSettingsResponse | null>(null);
  protected readonly form = signal<AdminSettings | null>(null);
  protected readonly activeQuestions = signal<number | null>(null);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<AdminMessage | null>(null);

  protected readonly errors = computed(() => {
    const form = this.form();
    const limits = this.response()?.limits;
    const errors: Partial<Record<NumericKey, string>> = {};
    if (!form || !limits) {
      return errors;
    }
    for (const field of FIELDS) {
      const value = form[field.key];
      const limit: SettingsLimit = limits[field.key];
      if (!Number.isInteger(value) || value < limit.min || value > limit.max) {
        errors[field.key] = `Erlaubt sind ${limit.min} bis ${limit.max}.`;
      }
    }
    return errors;
  });

  protected readonly valid = computed(() => Object.keys(this.errors()).length === 0);
  protected readonly dirty = computed(
    () => JSON.stringify(this.form()) !== JSON.stringify(this.response()?.settings),
  );
  protected readonly isDefault = computed(
    () => JSON.stringify(this.form()) === JSON.stringify(this.response()?.defaults),
  );
  protected readonly questionWarning = computed(() => {
    const active = this.activeQuestions();
    const required = this.form()?.questionsPerGame;
    return active !== null && required !== undefined && active < required
      ? `Achtung: Es gibt nur ${active} aktive Fragen. Mit ${required} Fragen pro Duell kann nicht gespielt werden.`
      : null;
  });
  protected readonly gameDuration = computed(() => {
    const f = this.form();
    if (!f) {
      return '';
    }
    const seconds =
      COUNTDOWN_SEC +
      f.questionsPerGame * (f.questionDurationSec + f.revealDurationSec);
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return minutes > 0 ? `${minutes} Min. ${rest} Sek.` : `${rest} Sek.`;
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    try {
      const [response, dashboard] = await Promise.all([
        this.api.settings(),
        this.api.dashboard(),
      ]);
      this.response.set(response);
      this.form.set({ ...response.settings });
      this.activeQuestions.set(dashboard.activeQuestions);
      this.loadError.set(false);
    } catch {
      this.loadError.set(true);
    }
  }

  protected limit(key: NumericKey): SettingsLimit {
    return this.response()?.limits[key] ?? { min: 0, max: 0 };
  }

  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    const value = raw === '' ? Number.NaN : Number(raw);
    this.form.update((form) => (form ? { ...form, [key]: value } : form));
  }

  protected setSpeedBonus(event: Event): void {
    const enabled = eventChecked(event);
    this.form.update((form) =>
      form ? { ...form, speedBonusEnabled: enabled } : form,
    );
  }

  /** Fills in the recommended defaults; they apply once saved. */
  protected applyDefaults(): void {
    const defaults = this.response()?.defaults;
    if (defaults) {
      this.form.set({ ...defaults });
      this.message.set(null);
    }
  }

  protected discardChanges(): void {
    const settings = this.response()?.settings;
    if (settings) {
      this.form.set({ ...settings });
    }
  }

  protected async save(): Promise<void> {
    const form = this.form();
    if (!form || !this.valid()) {
      return;
    }
    this.saving.set(true);
    try {
      const response = await this.api.saveSettings(form);
      this.response.set(response);
      this.form.set({ ...response.settings });
      this.message.set({
        variant: 'success',
        text: 'Gespeichert. Gilt ab dem nächsten Duell.',
      });
    } catch {
      this.message.set({
        variant: 'error',
        text: 'Speichern fehlgeschlagen. Bitte prüfe die Werte.',
      });
    } finally {
      this.saving.set(false);
    }
  }
}
