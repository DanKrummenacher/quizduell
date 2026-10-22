// Redaktion: the start page, written as a short report.
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../../proposals/pro';
import {
  durationOf,
  formatDuration,
  ProposalStore,
} from '../../proposals/proposal-store';
import { RedaktionState } from './redaktion-state';

@Component({
  selector: 'app-redaktion-start',
  template: `
    <header class="head">
      <span class="crumb">{{ today }}</span>
      <h1>Übersicht</h1>
    </header>

    @if (store.stats(); as s) {
      <div class="prose">
        <p>
          Das Quiz ist
          @if (store.ready()) {
            <mark class="ok">bereit</mark>.
          } @else {
            <mark class="bad">nicht spielbar</mark> – es fehlen noch
            {{ store.missingQuestions() }} aktive Fragen.
          }
          {{ s.activeQuestions }} von {{ store.counts().total }} Fragen in
          {{ store.categoryStats().length }}
          {{ store.categoryStats().length === 1 ? 'Kategorie' : 'Kategorien' }} sind
          im Spiel; ein Duell dauert höchstens {{ duration() }}
        </p>
        <p>
          Gerade
          @if (s.activeGames === 0) {
            läuft kein Duell
          } @else {
            {{ s.activeGames === 1 ? 'läuft' : 'laufen' }}
            <strong
              >{{ s.activeGames }}
              {{ s.activeGames === 1 ? 'Duell' : 'Duelle' }}</strong
            >
          }
          auf {{ s.playersOnline }}
          {{ s.playersOnline === 1 ? 'Gerät' : 'Geräten' }}. Heute wurden
          <strong>{{ s.gamesToday }} Duelle</strong> gespielt, seit Beginn
          {{ s.gamesTotal }}, und {{ store.overallRate() ?? '–' }} % aller Antworten
          waren richtig.
        </p>
      </div>
    }

    <h2>Kategorien</h2>
    <ul class="pages">
      @for (c of store.categoryStats(); track c.name) {
        <li>
          <button
            type="button"
            class="page"
            (click)="state.open({ kind: 'category', name: c.name })"
          >
            <css-icon icon="document" size="sm"></css-icon>
            <span class="page-name">{{ c.name || 'Ohne Kategorie' }}</span>
            <span class="page-meta"
              >{{ c.total }} Fragen · {{ c.active }} im Spiel</span
            >
          </button>
        </li>
      }
      <li>
        @if (naming()) {
          <form class="new" (submit)="$event.preventDefault(); create(field.value)">
            <css-icon icon="add" size="sm"></css-icon>
            <input
              #field
              placeholder="Name der neuen Kategorie"
              aria-label="Name der neuen Kategorie"
            />
            <button type="submit" class="solid">Anlegen</button>
          </form>
        } @else {
          <button type="button" class="page add" (click)="naming.set(true)">
            <css-icon icon="add" size="sm"></css-icon>
            <span class="page-name">Neue Kategorie</span>
          </button>
        }
      </li>
    </ul>

    @if (pro.issueCount()) {
      <h2>Lohnt einen Blick</h2>
      <ul class="issues">
        @for (issue of pro.issues(); track issue.kind) {
          @if (issue.ids.length) {
            <li>
              <strong
                >{{ issue.ids.length }} × {{ issue.title.toLowerCase() }}</strong
              >
              <span>{{ issue.text }}.</span>
              <span class="list">
                @for (q of questionsOf(issue.ids); track q.id) {
                  <button
                    type="button"
                    class="link"
                    (click)="
                      state.open({ kind: 'category', name: q.category ?? '' })
                    "
                  >
                    {{ q.text }}
                  </button>
                }
              </span>
            </li>
          }
        }
      </ul>
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'redaktion' as r;

    :host {
      display: block;
    }

    .head {
      margin-bottom: functions.rem(24);

      h1 {
        @include r.doc-title;
        margin-top: functions.rem(4);
      }
    }

    .crumb {
      font-size: functions.rem(13);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: r.$ink-3;
    }

    .prose p {
      margin: 0 0 functions.rem(18);
      font-size: functions.rem(20);
      line-height: 1.65;
    }

    mark {
      padding: 0 functions.rem(6);
      border-radius: functions.rem(4);
      font-weight: miscs.$css-ui-font-weight-bold;

      &.ok {
        background-color: r.$green-soft;
        color: r.$green;
      }

      &.bad {
        background-color: #fdecea;
        color: r.$red;
      }
    }

    h2 {
      margin: functions.rem(36) 0 functions.rem(10);
      font-size: functions.rem(14);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: r.$ink-3;
    }

    .pages,
    .issues {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .page {
      display: flex;
      align-items: center;
      gap: functions.rem(12);
      width: 100%;
      min-height: functions.rem(44);
      padding: 0 functions.rem(10);
      border: 0;
      border-radius: functions.rem(8);
      background: none;
      font: inherit;
      color: r.$ink;
      text-align: left;
      cursor: pointer;
      @include r.focus;

      &:hover {
        background-color: r.$hover;
      }

      css-icon {
        color: r.$ink-3;
      }

      &.add {
        color: r.$ink-2;
      }
    }

    .page-name {
      flex: 1 1 auto;
      font-size: functions.rem(16);
      font-weight: miscs.$css-ui-font-weight-bold;
    }

    .add .page-name {
      font-weight: miscs.$css-ui-font-weight-regular;
    }

    .page-meta {
      font-size: functions.rem(13);
      color: r.$ink-3;
    }

    .new {
      display: flex;
      align-items: center;
      gap: functions.rem(12);
      padding: functions.rem(6) functions.rem(10);

      input {
        @include r.bare;
        flex: 1 1 auto;
        font-size: functions.rem(16);
      }
    }

    .solid {
      @include r.solid-button;
    }

    .issues li {
      display: grid;
      gap: functions.rem(4);
      padding: functions.rem(12) 0;
      border-top: functions.rem(1) solid r.$line;
      font-size: functions.rem(15);
      color: r.$ink-2;

      strong {
        color: r.$ink;
      }
    }

    .list {
      display: flex;
      flex-wrap: wrap;
      gap: functions.rem(4) functions.rem(12);
    }

    .link {
      padding: 0;
      border: 0;
      background: none;
      font: inherit;
      font-size: functions.rem(14);
      color: r.$ink;
      text-decoration: underline;
      text-decoration-color: #c3cddb;
      text-underline-offset: 0.2em;
      cursor: pointer;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RedaktionStartComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(RedaktionState);
  protected readonly naming = signal(false);
  protected readonly today = new Date().toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  protected readonly duration = computed(() =>
    formatDuration(durationOf(this.store.settings())),
  );

  protected questionsOf(ids: number[]) {
    const set = new Set(ids);
    return (this.store.questions() ?? []).filter((q) => set.has(q.id)).slice(0, 4);
  }

  /** A category starts as an empty page; it exists once a question is in it. */
  protected create(name: string): void {
    const value = name.trim();
    this.naming.set(false);
    if (value) {
      this.state.open({ kind: 'category', name: value });
    }
  }
}
