// Atelier: the rules as setting cards, each with its own save.
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/icon';
import type { AdminSettings } from '../../../core/contracts/admin.contract';
import {
  BASE_POINTS,
  formatDuration,
  MAX_SPEED_BONUS,
  NUMERIC_FIELDS,
  type NumericField,
  type NumericKey,
  ProposalStore,
} from '../../proposals/proposal-store';
import { AtelierState } from './atelier-state';

interface Card {
  title: string;
  text: string;
  fields: NumericField[];
  bonus: boolean;
}

const field = (key: NumericKey) => NUMERIC_FIELDS.find((f) => f.key === key)!;

@Component({
  selector: 'app-atelier-rules',
  template: `
    <header class="head">
      <div>
        <h1>Spielregeln</h1>
        <p>
          Gelten ab dem nächsten Duell. Laufende Duelle spielen mit den alten Regeln
          fertig.
        </p>
      </div>
      <button
        type="button"
        class="ghost"
        [disabled]="store.isDefault()"
        (click)="store.applyDefaults()"
      >
        <css-icon icon="reload" size="sm"></css-icon>Empfohlene Werte
      </button>
    </header>

    @if (store.form(); as f) {
      <div class="layout">
        <div class="cards">
          @for (card of cards; track card.title) {
            <section class="card" [class.changed]="changed(card)">
              <header class="card-head">
                <h2>{{ card.title }}</h2>
                <p>{{ card.text }}</p>
              </header>
              @for (item of card.fields; track item.key) {
                <div class="setting">
                  <div class="setting-text">
                    <span class="setting-label">{{ item.label }}</span>
                    <span class="setting-hint">{{ item.hint }}</span>
                    @if (store.errors()[item.key]; as error) {
                      <span class="error">{{ error }}</span>
                    }
                  </div>
                  <div
                    class="stepper"
                    [class.bad]="!!store.errors()[item.key]"
                    [class.dirty]="isDirty(item.key)"
                  >
                    <button
                      type="button"
                      [attr.aria-label]="item.label + ' verringern'"
                      [disabled]="f[item.key] <= store.limit(item.key).min"
                      (click)="step(item.key, -1)"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputmode="numeric"
                      [attr.aria-label]="item.label"
                      [min]="store.limit(item.key).min"
                      [max]="store.limit(item.key).max"
                      [value]="f[item.key]"
                      (input)="set(item.key, $event)"
                    />
                    @if (item.unit) {
                      <span class="unit">{{ item.unit }}</span>
                    }
                    <button
                      type="button"
                      [attr.aria-label]="item.label + ' erhöhen'"
                      [disabled]="f[item.key] >= store.limit(item.key).max"
                      (click)="step(item.key, 1)"
                    >
                      +
                    </button>
                  </div>
                </div>
              }
              @if (card.bonus) {
                <div class="setting">
                  <div class="setting-text">
                    <span class="setting-label">Tempo-Bonus</span>
                    <span class="setting-hint"
                      >Richtig gibt {{ base }} Punkte; wer schnell ist, bekommt bis
                      zu {{ bonus }} dazu.</span
                    >
                  </div>
                  <button
                    type="button"
                    role="switch"
                    class="toggle"
                    [class.dirty]="
                      f.speedBonusEnabled !== store.settings()?.speedBonusEnabled
                    "
                    [attr.aria-checked]="f.speedBonusEnabled"
                    aria-label="Tempo-Bonus"
                    (click)="store.setSpeedBonus(!f.speedBonusEnabled)"
                  >
                    <span class="knob"></span>
                  </button>
                </div>
              }
              <footer class="card-foot">
                <span>{{ footnote(card, f) }}</span>
                <button
                  type="button"
                  class="primary"
                  [disabled]="!changed(card) || !store.valid() || store.saving()"
                  (click)="save()"
                >
                  {{ store.saving() ? 'Speichert …' : 'Speichern' }}
                </button>
              </footer>
            </section>
          }
        </div>

        <aside class="impact" aria-label="Auswirkung">
          <span class="impact-label">So läuft ein Duell</span>
          <div
            class="timeline"
            role="img"
            [attr.aria-label]="'Ein Duell dauert ' + duration()"
          >
            @for (seg of store.timeline(); track $index) {
              <span
                class="seg"
                [class]="seg.kind"
                [style.flex-grow]="seg.seconds"
                [title]="seg.label + ' · ' + seg.seconds + ' s'"
              ></span>
            }
          </div>
          <div class="legend">
            <span><i class="countdown"></i>Start</span>
            <span><i class="question"></i>Antworten</span>
            <span><i class="reveal"></i>Auflösung</span>
          </div>
          <dl class="facts">
            <div>
              <dt>Dauer</dt>
              <dd>{{ duration() }}</dd>
            </div>
            <div>
              <dt>Punkte max.</dt>
              <dd>{{ store.maxPoints() }}</dd>
            </div>
            <div>
              <dt>Aktive Fragen</dt>
              <dd [class.bad]="!!store.questionWarning()">
                {{ store.counts().active }}
              </dd>
            </div>
          </dl>
          @if (store.questionWarning(); as warning) {
            <p class="warning">{{ warning }}</p>
          }
          @if (store.dirty()) {
            <button
              type="button"
              class="ghost full"
              (click)="store.discardSettings()"
            >
              Alle Änderungen verwerfen
            </button>
          }
        </aside>
      </div>
    }
  `,
  styleUrl: './atelier-rules.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AtelierRulesComponent {
  protected readonly store = inject(ProposalStore);
  private readonly state = inject(AtelierState);
  protected readonly base = BASE_POINTS;
  protected readonly bonus = MAX_SPEED_BONUS;
  protected readonly duration = computed(() =>
    this.store.valid() ? formatDuration(this.store.gameSeconds()) : '–',
  );

  protected readonly cards: Card[] = [
    {
      title: 'Duell',
      text: 'Wie viele Fragen, wie viel Zeit und ob Tempo zählt.',
      fields: [
        field('questionsPerGame'),
        field('questionDurationSec'),
        field('revealDurationSec'),
      ],
      bonus: true,
    },
    {
      title: 'Nach dem Duell',
      text: 'Beide können eine Revanche fordern.',
      fields: [field('rematchTimeoutSec')],
      bonus: false,
    },
    {
      title: 'Geräte am Stand',
      text: 'Zurück zur Startseite, wenn niemand mehr spielt.',
      fields: [field('idleResetSec')],
      bonus: false,
    },
  ];

  protected isDirty(key: NumericKey): boolean {
    return this.store.form()?.[key] !== this.store.settings()?.[key];
  }

  protected changed(card: Card): boolean {
    const f = this.store.form();
    const s = this.store.settings();
    return (
      card.fields.some((item) => this.isDirty(item.key)) ||
      (card.bonus && !!f && !!s && f.speedBonusEnabled !== s.speedBonusEnabled)
    );
  }

  protected footnote(card: Card, f: AdminSettings): string {
    if (card.bonus) {
      return `Ein Duell dauert höchstens ${this.duration()}`;
    }
    if (card.fields[0]?.key === 'idleResetSec') {
      return f.idleResetSec === 0
        ? 'Aus: Geräte bleiben stehen.'
        : `Nach ${f.idleResetSec} s ohne Bedienung.`;
    }
    return `${f.rematchTimeoutSec} s für die Antwort auf eine Revanche.`;
  }

  protected set(key: NumericKey, event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }

  protected step(key: NumericKey, delta: number): void {
    const limit = this.store.limit(key);
    const value = (this.store.form()?.[key] ?? 0) + delta;
    this.store.setNumber(key, Math.min(limit.max, Math.max(limit.min, value)));
  }

  /** Saves all changed rules, with «Rückgängig». */
  protected async save(): Promise<void> {
    const previous = this.store.settings();
    await this.store.saveSettings();
    if (!this.store.dirty() && previous) {
      this.store.message.set(null);
      this.state.toast('Spielregeln gespeichert', () =>
        this.store.applyAndSave(previous),
      );
    }
  }
}
