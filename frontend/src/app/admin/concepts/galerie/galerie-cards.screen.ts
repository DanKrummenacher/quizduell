// TEMPORARY: concept 5 «Galerie», inside one deck with a flipped card (development only).
import { Component } from '@angular/core';
import { CATEGORIES, QUESTIONS } from '../mock';

const COLORS: Record<string, string> = {
  Allgemeinwissen: '#00a4e0',
  Logik: '#0078bb',
  Schweiz: '#d53419',
  Technik: '#00875e',
};

@Component({
  selector: 'app-galerie-cards-screen',
  template: `
    <div class="app">
      <header class="top">
        <span class="back">‹ Stapel</span>
        <h1><i></i>Schweiz</h1>
        <span class="muted">5 Karten · alle im Spiel</span>
        <span class="sort">Sortiert nach: schwierigste zuerst ▾</span>
      </header>

      <div class="grid">
        @for (q of cards; track q.id) {
          @if (q.id === 2) {
            <article class="card flipped">
              <div class="rear">
                <div class="r-head">
                  <span>Rückseite</span><span class="turn">↺ umdrehen</span>
                </div>
                <div class="ring" [style.--p]="q.rate">
                  <b>{{ q.rate }}%</b><span>richtig</span>
                </div>
                <div class="dist">
                  @for (o of q.options; track $index; let j = $index) {
                    <div class="d-row" [class.ok]="j === q.correct">
                      <span>{{ o }}</span
                      ><i [style.width.%]="split[j]"></i><em>{{ split[j] }}%</em>
                    </div>
                  }
                </div>
                <p class="tip">
                  Die meisten tippen auf Matterhorn – eine gute, knifflige Frage.
                </p>
              </div>
            </article>
          } @else if (q.id === 13) {
            <article class="spot"></article>
          } @else {
            <article class="card" [class.paused]="!q.active">
              <div class="face">
                <span class="rate" [class.hard]="(q.rate ?? 50) < 35">{{
                  q.rate === null ? 'neu' : q.rate + '%'
                }}</span>
                <b>{{ q.text }}</b>
              </div>
              <div class="slots">
                @for (o of q.options; track $index; let j = $index) {
                  <span class="slot" [class.ok]="j === q.correct">{{ o }}</span>
                }
              </div>
            </article>
          }
        }
        <article class="new">
          ＋<span>Neue Karte</span><small>oder Fragen aus CSV hineinziehen</small>
        </article>
      </div>

      <div class="dock">
        <span class="drag">
          <b>Welche Farbe hat der Schweizer Pass?</b>
        </span>
        <span class="hint"
          >Karte auf einen Stapel ziehen, um sie zu verschieben</span
        >
        @for (c of others; track c.name) {
          <span
            class="target"
            [class.hover]="c.name === 'Allgemeinwissen'"
            [style.--deck]="color(c.name)"
            ><i></i>{{ c.name }}</span
          >
        }
        <span class="target pause">⏸ Pausieren</span>
      </div>
    </div>
  `,
  styles: `
    @use 'galerie' as g;
    :host {
      display: block;
      width: 1280px;
      height: 800px;
    }
    .app {
      position: relative;
      height: 100%;
      background: g.$bg;
      color: g.$ink;
      font-size: 14px;
    }
    .top {
      display: flex;
      align-items: center;
      gap: 18px;
      height: 84px;
      padding: 0 48px;
    }
    .back {
      color: g.$ink-2;
      font-weight: 500;
    }
    h1 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }
    h1 i {
      width: 14px;
      height: 14px;
      border-radius: 4px;
      background: #d53419;
    }
    .muted {
      color: g.$ink-2;
    }
    .sort {
      margin-left: auto;
      padding: 8px 14px;
      border-radius: 20px;
      background: #fff;
      color: g.$ink-2;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-auto-rows: 270px;
      gap: 24px;
      padding: 4px 48px;
    }
    .card {
      @include g.card;
    }
    .card.paused {
      opacity: 0.5;
    }
    .face {
      @include g.face;
      flex: 1;
      border-top: 6px solid #d53419;
    }
    .face b {
      font-size: 17px;
      font-weight: 500;
      line-height: 1.3;
    }
    .rate {
      align-self: flex-end;
      padding: 3px 8px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.14);
      font-size: 12px;
      font-weight: 700;
    }
    .rate.hard {
      background: #fff;
      color: g.$red;
    }
    .slots {
      @include g.slots;
    }
    .slot {
      @include g.slot;
    }
    .slot.ok {
      border-color: g.$green;
      background: g.$green;
      color: #fff;
    }
    .flipped {
      padding: 14px 16px;
      box-shadow:
        0 0 0 2px #00a4e0,
        0 16px 40px rgba(0, 50, 125, 0.18);
    }
    .rear {
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100%;
    }
    .r-head {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: g.$ink-3;
    }
    .turn {
      color: #0078bb;
      font-weight: 700;
    }
    .ring {
      display: grid;
      place-content: center;
      justify-items: center;
      width: 74px;
      height: 74px;
      border-radius: 50%;
      background:
        radial-gradient(#fff 58%, transparent 59%),
        conic-gradient(#e09a00 calc(var(--p) * 1%), #e8edf4 0);
    }
    .ring b {
      font-size: 17px;
    }
    .ring span {
      font-size: 10px;
      color: g.$ink-3;
    }
    .dist {
      display: grid;
      gap: 4px;
    }
    .d-row {
      display: grid;
      grid-template-columns: 82px 1fr 30px;
      align-items: center;
      gap: 6px;
      font-size: 11px;
    }
    .d-row span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .d-row i {
      height: 6px;
      border-radius: 3px;
      background: #c9d4e4;
    }
    .d-row.ok i {
      background: g.$green;
    }
    .d-row em {
      font-style: normal;
      text-align: right;
      color: g.$ink-2;
    }
    .tip {
      margin: auto 0 0;
      font-size: 11px;
      line-height: 1.4;
      color: g.$ink-2;
    }
    .spot {
      border-radius: 14px;
      background: #e2e8f1;
      box-shadow: inset 0 2px 6px rgba(0, 50, 125, 0.08);
    }
    .new {
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 6px;
      border: 2px dashed #b8c5d9;
      border-radius: 14px;
      font-size: 30px;
      color: g.$ink-3;
    }
    .new span {
      font-size: 15px;
      font-weight: 700;
      color: g.$ink;
    }
    .new small {
      font-size: 12px;
    }

    .dock {
      position: absolute;
      left: 48px;
      right: 48px;
      bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 16px;
      background: g.$ink;
      color: #fff;
      box-shadow: 0 16px 40px rgba(0, 50, 125, 0.3);
    }
    .drag {
      position: absolute;
      left: 650px;
      top: -96px;
      width: 200px;
      padding: 14px;
      border-top: 6px solid #d53419;
      border-radius: 12px;
      background: g.$ink;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      transform: rotate(-4deg);
      font-size: 13px;
    }
    .hint {
      flex: 1;
      color: rgba(255, 255, 255, 0.7);
    }
    .target {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: 1px dashed rgba(255, 255, 255, 0.35);
      border-radius: 12px;
      font-weight: 700;
    }
    .target i {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      background: var(--deck);
    }
    .target.hover {
      border-style: solid;
      border-color: #00e09d;
      background: rgba(0, 224, 157, 0.14);
    }
    .target.pause {
      color: rgba(255, 255, 255, 0.8);
    }
  `,
})
export class GalerieCardsScreen {
  protected readonly cards = [
    ...QUESTIONS.filter((q) => q.category === 'Schweiz'),
  ].sort((a, b) => (a.rate ?? 50) - (b.rate ?? 50));
  protected readonly others = CATEGORIES.filter((c) => c.name !== 'Schweiz');
  /** Share of players per answer for the flipped card. */
  protected readonly split = [44, 38, 11, 7];

  protected color(category: string): string {
    return COLORS[category] ?? '#00327d';
  }
}
