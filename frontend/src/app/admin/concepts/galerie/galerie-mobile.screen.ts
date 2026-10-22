// TEMPORARY: concept 5 «Galerie» on the phone – swipe through the cards (development only).
import { Component } from '@angular/core';
import { QUESTIONS } from '../mock';

@Component({
  selector: 'app-galerie-mobile-screen',
  template: `
    <div class="app">
      <header>
        <span class="x">✕</span><b>Karten prüfen</b><span class="count">3 / 4</span>
      </header>
      <p class="why">Diese Karten fallen auf – behalten oder pausieren?</p>
      <div class="stack">
        <span class="under"></span>
        <article class="card">
          <div class="face">
            <span class="tag">Logik · nur {{ q.rate }}% richtig</span>
            <b>{{ q.text }}</b>
          </div>
          <div class="slots">
            @for (o of q.options; track $index; let j = $index) {
              <span class="slot" [class.ok]="j === q.correct">{{ o }}</span>
            }
          </div>
          <span class="stamp">BEHALTEN</span>
        </article>
      </div>
      <div class="actions">
        <span class="btn">⏸<small>Pausieren</small></span>
        <span class="btn edit">✎<small>Bearbeiten</small></span>
        <span class="btn keep">✓<small>Behalten</small></span>
      </div>
    </div>
  `,
  styles: `
    @use 'galerie' as g;
    :host {
      display: block;
      width: 390px;
      height: 844px;
    }
    .app {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 56px 20px 36px;
      background: g.$bg;
      color: g.$ink;
      font-size: 14px;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    header b {
      font-size: 17px;
    }
    .x,
    .count {
      color: g.$ink-2;
    }
    .why {
      margin: 10px 0 24px;
      text-align: center;
      color: g.$ink-2;
    }
    .stack {
      position: relative;
      flex: 1;
    }
    .under {
      position: absolute;
      inset: 14px 14px -10px;
      border-radius: 18px;
      background: #c9d4e4;
    }
    .card {
      @include g.card;
      position: absolute;
      inset: 0;
      border-radius: 18px;
      transform: rotate(5deg) translateX(18px);
    }
    .face {
      @include g.face;
      flex: 1;
      padding: 22px;
      border-top: 8px solid #0078bb;
    }
    .face b {
      font-size: 24px;
      font-weight: 300;
      line-height: 1.3;
    }
    .tag {
      align-self: flex-start;
      padding: 4px 10px;
      border-radius: 12px;
      background: #fff;
      color: g.$red;
      font-size: 12px;
      font-weight: 700;
    }
    .slots {
      @include g.slots;
      padding: 14px;
      gap: 8px;
    }
    .slot {
      @include g.slot;
      padding: 12px;
      font-size: 15px;
    }
    .slot.ok {
      border-color: g.$green;
      background: g.$green;
      color: #fff;
    }
    .stamp {
      position: absolute;
      top: 92px;
      left: 26px;
      padding: 6px 12px;
      border: 3px solid #00e09d;
      border-radius: 8px;
      color: #00e09d;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.08em;
      transform: rotate(-12deg);
    }
    .actions {
      display: flex;
      justify-content: center;
      gap: 22px;
      margin-top: 36px;
    }
    .btn {
      display: grid;
      justify-items: center;
      align-content: center;
      gap: 2px;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #fff;
      font-size: 22px;
      box-shadow: 0 6px 16px rgba(0, 50, 125, 0.12);
    }
    .btn small {
      font-size: 10px;
      color: g.$ink-2;
    }
    .btn.edit {
      width: 56px;
      height: 56px;
      align-self: center;
      font-size: 18px;
    }
    .btn.keep {
      background: g.$green;
      color: #fff;
    }
    .btn.keep small {
      color: rgba(255, 255, 255, 0.85);
    }
  `,
})
export class GalerieMobileScreen {
  protected readonly q = QUESTIONS.find((x) => x.id === 6)!;
}
