// TEMPORARY: concept 5 «Galerie», the decks overview (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { CATEGORIES, LIVE, QUESTIONS } from '../mock';

const COLORS: Record<string, string> = {
  Allgemeinwissen: '#00a4e0',
  Logik: '#0078bb',
  Schweiz: '#d53419',
  Technik: '#00875e',
};

@Component({
  selector: 'app-galerie-decks-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="app">
      <header class="top">
        <app-concept-brand [size]="22" />
        <nav>
          <span class="on">Stapel</span><span>Alle Karten</span
          ><span>Spielregeln</span>
        </nav>
        <span class="live"><i></i>{{ live.duels }} Duelle laufen</span>
      </header>

      <div class="intro">
        <div>
          <h1>Deine Fragen-Stapel</h1>
          <p>
            {{ live.activeQuestions }} von {{ live.totalQuestions }} Karten sind im
            Spiel. Jedes Duell zieht aus allen Stapeln.
          </p>
        </div>
        <div class="mix">
          @for (c of categories; track c.name) {
            <i [style.flex]="c.active" [style.background]="color(c.name)"></i>
          }
        </div>
      </div>

      <div class="decks">
        @for (c of categories; track c.name) {
          <article class="deck" [style.--deck]="color(c.name)">
            <div class="pile">
              <span class="back b2"></span>
              <span class="back b1"></span>
              <div class="card">
                <div class="face">
                  <span class="cat">{{ c.name }}</span>
                  <b>{{ top(c.name).text }}</b>
                </div>
                <div class="slots">
                  @for (o of top(c.name).options; track $index; let j = $index) {
                    <span class="slot" [class.ok]="j === top(c.name).correct">{{
                      o
                    }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="info">
              <b>{{ c.name }}</b>
              <span>{{ c.total }} Karten · {{ c.rate }} % richtig</span>
            </div>
            @if (c.active < c.total) {
              <span class="note">{{ c.total - c.active }} pausiert</span>
            }
          </article>
        }
        <article class="deck empty">
          <div class="pile">
            <div class="ghost">＋<span>Neuer Stapel</span></div>
          </div>
          <div class="info">
            <b>Kategorie anlegen</b><span>Karten später hineinziehen</span>
          </div>
        </article>
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
      height: 100%;
      background: g.$bg;
      color: g.$ink;
      font-size: 14px;
    }
    .top {
      display: flex;
      align-items: center;
      gap: 40px;
      height: 68px;
      padding: 0 48px;
    }
    nav {
      display: flex;
      gap: 6px;
    }
    nav span {
      padding: 8px 14px;
      border-radius: 20px;
      color: g.$ink-2;
      font-weight: 500;
    }
    nav .on {
      background: g.$ink;
      color: #fff;
    }
    .live {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      color: g.$ink-2;
    }
    .live i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00e09d;
    }
    .intro {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 40px;
      padding: 28px 48px 8px;
    }
    h1 {
      margin: 0;
      font-size: 34px;
      font-weight: 300;
    }
    .intro p {
      margin: 6px 0 0;
      color: g.$ink-2;
    }
    .mix {
      display: flex;
      gap: 3px;
      width: 320px;
      height: 10px;
    }
    .mix i {
      border-radius: 5px;
    }
    .decks {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 28px;
      padding: 40px 48px;
    }
    .deck {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .pile {
      position: relative;
      height: 330px;
    }
    .back {
      position: absolute;
      inset: 0;
      border-radius: 14px;
      background: var(--deck);
    }
    .b1 {
      transform: rotate(4deg) translate(6px, 4px);
      opacity: 0.55;
    }
    .b2 {
      transform: rotate(-3deg) translate(-4px, 8px);
      opacity: 0.3;
    }
    .card {
      @include g.card;
      position: absolute;
      inset: 0;
    }
    .face {
      @include g.face;
      flex: 1;
      border-top: 6px solid var(--deck);
    }
    .face b {
      font-size: 18px;
      font-weight: 500;
      line-height: 1.3;
    }
    .cat {
      align-self: flex-start;
      padding: 3px 8px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.14);
      font-size: 11px;
      font-weight: 700;
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
    .info {
      display: grid;
      gap: 2px;
    }
    .info b {
      font-size: 17px;
    }
    .info span {
      color: g.$ink-2;
    }
    .note {
      align-self: flex-start;
      padding: 3px 8px;
      border-radius: 10px;
      background: #fff;
      font-size: 12px;
      color: g.$ink-2;
    }
    .ghost {
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 8px;
      height: 100%;
      border: 2px dashed #b8c5d9;
      border-radius: 14px;
      font-size: 32px;
      color: g.$ink-3;
    }
    .ghost span {
      font-size: 14px;
      font-weight: 700;
    }
  `,
})
export class GalerieDecksScreen {
  protected readonly live = LIVE;
  protected readonly categories = CATEGORIES;

  protected color(category: string): string {
    return COLORS[category] ?? '#00327d';
  }

  /** The card on top of each deck: the one that needs attention most. */
  protected top(category: string) {
    return [...QUESTIONS]
      .filter((q) => q.category === category)
      .sort((a, b) => (a.rate ?? 50) - (b.rate ?? 50))[0]!;
  }
}
