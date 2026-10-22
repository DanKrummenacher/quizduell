// TEMPORARY: concept 4 «Midnight», questions and detail (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { CATEGORIES, LETTERS, LIVE, QUESTIONS } from '../mock';

@Component({
  selector: 'app-midnight-list-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="app">
      <aside class="side">
        <app-concept-brand [inverse]="true" [size]="20" class="brand" />
        <span class="item">Übersicht <kbd>G O</kbd></span>
        <span class="item on">Fragen <kbd>G F</kbd></span>
        <span class="item">Spielregeln <kbd>G R</kbd></span>
        <span class="group">Kategorien</span>
        @for (c of categories; track c.name) {
          <span class="item"
            ><i class="sq"></i>{{ c.name }}<em>{{ c.total }}</em></span
          >
        }
        <div class="live">
          <i></i>{{ live.duels }} Duelle · {{ live.devices }} Geräte
        </div>
      </aside>

      <section class="list">
        <header class="l-head">
          <b>Fragen</b><span class="muted">32</span>
          <span class="filter">Gruppiert nach Kategorie</span>
          <span class="spacer"></span>
          <span class="muted">Neu <kbd>C</kbd></span>
        </header>
        @for (group of groups; track group.name) {
          <div class="g-head">
            {{ group.name }} <span>{{ group.total }}</span>
          </div>
          @for (q of group.items; track q.id) {
            <div class="row" [class.on]="q.id === 2">
              <span class="state" [class.off]="!q.active"></span>
              <span class="id">Q-{{ q.id }}</span>
              <span class="text">{{ q.text }}</span>
              <span
                class="rate"
                [class.low]="(q.rate ?? 100) < 40"
                [class.high]="(q.rate ?? 0) > 90"
                >{{ q.rate === null ? 'neu' : q.rate + '%' }}</span
              >
            </div>
          }
          @if (group.total > group.items.length) {
            <div class="more">
              {{ group.total - group.items.length }} weitere anzeigen
            </div>
          }
        }
      </section>

      <section class="detail">
        <div class="d-head">
          <span class="id">Q-2</span
          ><span class="muted">Schweiz · aktiv · 37× gestellt</span>
        </div>
        <h1>Welches ist der höchste Berg der Schweiz?</h1>
        <div class="opts">
          @for (o of current.options; track $index; let j = $index) {
            <div class="opt" [class.ok]="j === current.correct">
              <kbd>{{ j + 1 }}</kbd
              >{{ letters[j] }} · {{ o }}
            </div>
          }
        </div>
        <div class="props">
          <div><span>Richtig</span><b class="amber">38 %</b></div>
          <div><span>Kategorie</span><b>Schweiz</b></div>
          <div><span>Status</span><b class="green">● Im Spiel</b></div>
        </div>
        <div class="keys">
          <span><kbd>E</kbd> bearbeiten</span
          ><span><kbd>1</kbd>–<kbd>4</kbd> richtige Antwort</span
          ><span><kbd>P</kbd> pausieren</span
          ><span><kbd>J</kbd><kbd>K</kbd> nächste</span>
        </div>
      </section>
    </div>
  `,
  styles: `
    @use 'midnight' as m;
    :host {
      display: block;
      width: 1280px;
      height: 800px;
    }
    .app {
      display: grid;
      grid-template-columns: 220px 1fr 440px;
      height: 100%;
      background: m.$bg;
      color: m.$ink;
      font-size: 13px;
    }
    kbd {
      @include m.kbd;
      font-family: inherit;
    }
    .side {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 16px 10px;
      border-right: 1px solid m.$line;
    }
    .brand {
      margin: 0 8px 18px;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 30px;
      padding: 0 8px;
      border-radius: 6px;
      color: m.$ink-2;
    }
    .item kbd {
      margin-left: auto;
      opacity: 0.7;
    }
    .item em {
      margin-left: auto;
      font-style: normal;
      color: m.$ink-3;
    }
    .item.on {
      background: m.$raised;
      color: m.$ink;
    }
    .group {
      margin: 16px 8px 6px;
      font-size: 11px;
      color: m.$ink-3;
    }
    .sq {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: m.$accent;
    }
    .live {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: auto;
      padding: 10px 8px;
      color: m.$ink-2;
    }
    .live i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: m.$green;
      box-shadow: 0 0 8px m.$green;
    }

    .list {
      border-right: 1px solid m.$line;
      overflow: hidden;
    }
    .l-head {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 48px;
      padding: 0 18px;
      border-bottom: 1px solid m.$line;
    }
    .muted {
      color: m.$ink-3;
    }
    .filter {
      padding: 3px 8px;
      border: 1px solid m.$line;
      border-radius: 6px;
      color: m.$ink-2;
    }
    .spacer {
      flex: 1;
    }
    .g-head {
      padding: 12px 18px 6px;
      font-size: 12px;
      font-weight: 700;
      color: m.$ink-2;
    }
    .g-head span {
      margin-left: 6px;
      color: m.$ink-3;
    }
    .row {
      display: grid;
      grid-template-columns: 12px 44px 1fr 44px;
      align-items: center;
      gap: 10px;
      height: 36px;
      padding: 0 18px;
    }
    .row.on {
      background: m.$raised;
      box-shadow: inset 2px 0 0 m.$accent;
    }
    .state {
      width: 9px;
      height: 9px;
      border: 2px solid m.$green;
      border-radius: 50%;
      background: m.$green;
    }
    .state.off {
      background: none;
      border-color: m.$ink-3;
    }
    .id {
      font-size: 12px;
      color: m.$ink-3;
      font-variant-numeric: tabular-nums;
    }
    .text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .more {
      padding: 6px 18px 6px 40px;
      font-size: 12px;
      color: m.$ink-3;
    }
    .rate {
      text-align: right;
      color: m.$ink-2;
    }
    .rate.low {
      color: m.$red;
    }
    .rate.high {
      color: m.$amber;
    }

    .detail {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 22px 26px;
      background: m.$panel;
    }
    .d-head {
      display: flex;
      gap: 12px;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.3;
    }
    .opts {
      display: grid;
      gap: 6px;
    }
    .opt {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid m.$line;
      border-radius: 8px;
      color: m.$ink-2;
    }
    .opt.ok {
      border-color: rgba(52, 211, 153, 0.5);
      background: rgba(52, 211, 153, 0.1);
      color: m.$ink;
    }
    .props {
      display: grid;
      gap: 10px;
      padding-top: 16px;
      border-top: 1px solid m.$line;
    }
    .props div {
      display: flex;
      justify-content: space-between;
    }
    .props span {
      color: m.$ink-3;
    }
    .amber {
      color: m.$amber;
    }
    .green {
      color: m.$green;
    }
    .keys {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: auto;
      color: m.$ink-3;
      font-size: 12px;
    }
  `,
})
export class MidnightListScreen {
  protected readonly categories = CATEGORIES;
  protected readonly live = LIVE;
  protected readonly letters = LETTERS;
  protected readonly current = QUESTIONS[1]!;
  protected readonly groups = ['Schweiz', 'Logik', 'Technik'].map((name) => ({
    name,
    total: CATEGORIES.find((c) => c.name === name)?.total ?? 0,
    items: QUESTIONS.filter((q) => q.category === name),
  }));
}
