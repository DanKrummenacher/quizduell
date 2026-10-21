// TEMPORARY: proposal L «Klassik», overview (development only).
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../pro';
import { ProposalStore, successRate } from '../proposal-store';
import { ClassicState } from './classic-state';

@Component({
  selector: 'app-classic-overview',
  template: `
    <header class="head">
      <h1>Übersicht</h1>
      <button
        type="button"
        class="button primary"
        (click)="state.go({ name: 'question', id: 'new' })"
      >
        <css-icon icon="add" size="sm"></css-icon>Frage hinzufügen
      </button>
    </header>

    @if (!store.ready() && store.stats(); as s) {
      <div class="banner" role="alert">
        <css-icon icon="priority-warning" size="sm"></css-icon>
        <span
          ><strong>Das Quiz ist nicht spielbar.</strong> Es braucht mindestens
          {{ s.requiredQuestions }} aktive Fragen.</span
        >
        <button
          type="button"
          class="banner-link"
          (click)="state.go({ name: 'questions' })"
        >
          Fragen aktivieren
        </button>
      </div>
    }

    @if (store.stats(); as s) {
      <div class="kpis">
        <div class="kpi">
          <span>Duelle heute</span><strong>{{ s.gamesToday }}</strong>
        </div>
        <div class="kpi">
          <span>Duelle insgesamt</span><strong>{{ s.gamesTotal }}</strong>
        </div>
        <div class="kpi">
          <span>Laufen gerade</span><strong>{{ s.activeGames }}</strong>
        </div>
        <div class="kpi">
          <span>Aktive Fragen</span><strong>{{ s.activeQuestions }}</strong>
        </div>
      </div>
    }

    <div class="grid">
      <section class="card">
        <div class="card-head">
          <h2>Zuletzt bearbeitet</h2>
          <button
            type="button"
            class="link"
            (click)="state.go({ name: 'questions' })"
          >
            Alle Fragen
          </button>
        </div>
        <ul class="list">
          @for (q of recent(); track q.id) {
            <li>
              <button
                type="button"
                class="item"
                (click)="state.go({ name: 'question', id: q.id })"
              >
                <span class="item-text">{{ q.text }}</span>
                <span class="item-meta"
                  >{{ q.category || 'Ohne Kategorie' }} ·
                  {{ date(q.updatedAt) }}</span
                >
              </button>
            </li>
          } @empty {
            <li class="none">Noch keine Fragen.</li>
          }
        </ul>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Braucht Aufmerksamkeit</h2>
          @if (pro.issueCount()) {
            <button type="button" class="link" (click)="openIssues()">
              Anzeigen
            </button>
          }
        </div>
        <ul class="list">
          @for (issue of pro.issues(); track issue.kind) {
            <li class="issue">
              <span class="issue-count" [class.zero]="!issue.ids.length">{{
                issue.ids.length
              }}</span>
              <span>
                <strong>{{ issue.title }}</strong>
                <small>{{ issue.text }}</small>
              </span>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'interaction';
    @use '../kit';
    @use 'classic';

    .head {
      @include classic.head;
    }

    .button {
      @include classic.button;

      &.primary {
        @include classic.button(true);
      }
    }

    .banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: functions.rem(10);
      margin-bottom: functions.rem(20);
      padding: functions.rem(12) functions.rem(16);
      border: functions.rem(1) solid #f1c4bb;
      border-radius: functions.rem(8);
      background-color: #fdf1ee;
      color: #8f2210;
    }

    .banner-link,
    .link {
      padding: 0;
      border: 0;
      background: none;
      font: inherit;
      font-size: functions.rem(14);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$blue;
      text-decoration: underline;
      cursor: pointer;
    }

    .banner-link {
      margin-left: auto;
    }

    .kpis {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-bottom: functions.rem(20);
      @include classic.card;
      overflow: hidden;

      @media (min-width: 800px) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .kpi {
      display: grid;
      gap: functions.rem(4);
      padding: functions.rem(16) functions.rem(20);
      box-shadow:
        inset functions.rem(-1) 0 0 #eef1f6,
        inset 0 functions.rem(-1) 0 #eef1f6;

      span {
        font-size: functions.rem(13);
        color: kit.$muted;
      }

      strong {
        font-size: functions.rem(26);
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
      }
    }

    .grid {
      display: grid;
      gap: functions.rem(20);
      align-items: start;

      @media (min-width: 900px) {
        grid-template-columns: 1.4fr 1fr;
      }
    }

    .card {
      @include classic.card;
    }

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: functions.rem(16) functions.rem(20) functions.rem(8);

      h2 {
        margin: 0;
        font-size: functions.rem(16);
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
      }
    }

    .list {
      margin: 0;
      padding: 0 0 functions.rem(8);
      list-style: none;
    }

    .item {
      display: grid;
      gap: functions.rem(2);
      width: 100%;
      padding: functions.rem(10) functions.rem(20);
      border: 0;
      background: none;
      font: inherit;
      text-align: left;
      cursor: pointer;
      @include interaction.chip;
    }

    .item-text {
      overflow: hidden;
      font-size: functions.rem(15);
      color: kit.$blue;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-meta {
      font-size: functions.rem(13);
      color: kit.$muted;
    }

    .none {
      padding: functions.rem(16) functions.rem(20);
      color: kit.$muted;
    }

    .issue {
      display: flex;
      align-items: center;
      gap: functions.rem(14);
      padding: functions.rem(10) functions.rem(20);

      strong {
        display: block;
        font-size: functions.rem(15);
        color: kit.$blue;
      }

      small {
        font-size: functions.rem(13);
        color: kit.$muted;
      }
    }

    .issue-count {
      display: grid;
      place-items: center;
      flex: none;
      width: functions.rem(36);
      height: functions.rem(28);
      border-radius: functions.rem(14);
      background-color: #fff1cc;
      font-size: functions.rem(14);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: #7a5000;

      &.zero {
        background-color: #e5f3ee;
        color: kit.$green;
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClassicOverviewComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(ClassicState);
  protected readonly rate = successRate;

  protected readonly recent = computed(() =>
    [...(this.store.questions() ?? [])]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6),
  );

  protected date(value: string): string {
    return new Date(value).toLocaleString('de-CH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  protected openIssues(): void {
    this.state.tab.set('issues');
    this.state.go({ name: 'questions' });
  }
}
