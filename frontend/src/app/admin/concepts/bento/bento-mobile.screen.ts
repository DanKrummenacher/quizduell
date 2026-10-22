// TEMPORARY: concept 2 «Bento» on the phone (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { HOURS, LIVE, RULES } from '../mock';

@Component({
  selector: 'app-bento-mobile-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="app">
      <header class="top">
        <app-concept-brand [size]="24" /><span class="me">A</span>
      </header>
      <h1>Guten Tag</h1>
      <div class="grid">
        <section class="tile today">
          <span class="label">Heute</span>
          <strong>{{ live.today }}</strong>
          <div class="chart">
            @for (h of hours; track $index) {
              <i [style.height.%]="(h / max) * 100"></i>
            }
          </div>
        </section>
        <section class="tile live">
          <span class="label"><i></i>Live</span><strong>{{ live.duels }}</strong
          ><span>Duelle</span>
        </section>
        <section class="tile ready">
          <span class="ok">✓</span><strong>Bereit</strong>
        </section>
        <section class="tile rules">
          <span class="label">Regeln</span
          ><strong>{{ rules.questions }}×{{ rules.seconds }}s</strong
          ><span>max. {{ rules.duration }}</span>
        </section>
        <section class="tile create"><strong>＋ Neue Frage</strong></section>
      </div>
      <nav class="tabs">
        <span class="on">Übersicht</span><span>Fragen</span><span>Regeln</span>
      </nav>
    </div>
  `,
  styles: `
    @use 'bento' as b;
    :host {
      display: block;
      width: 390px;
      height: 844px;
    }
    .app {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 54px 16px 0;
      background: b.$bg;
      color: b.$ink;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .me {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: b.$blue;
      color: #fff;
      font-weight: 700;
    }
    h1 {
      margin: 18px 4px 14px;
      font-size: 32px;
      letter-spacing: -0.02em;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .tile {
      @include b.tile;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 16px;
      border-radius: 22px;
    }
    .label {
      @include b.label;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    strong {
      font-size: 40px;
      line-height: 1.05;
      letter-spacing: -0.03em;
    }
    .today {
      grid-column: span 2;
    }
    .chart {
      display: flex;
      align-items: flex-end;
      gap: 5px;
      height: 60px;
      margin-top: 8px;
    }
    .chart i {
      flex: 1;
      border-radius: 4px;
      background: #dfe6f1;
    }
    .chart i:nth-child(10) {
      background: b.$cyan;
    }
    .live {
      background: b.$blue;
      color: #fff;
    }
    .live .label {
      color: rgba(255, 255, 255, 0.7);
    }
    .live .label i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: b.$mint;
    }
    .live span:last-child {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.75);
    }
    .ready {
      justify-content: space-between;
      background: linear-gradient(160deg, #e3f6ee, #fff);
    }
    .ok {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: b.$green;
      color: #fff;
    }
    .ready strong {
      font-size: 26px;
      color: b.$green;
    }
    .rules strong {
      font-size: 30px;
    }
    .rules span:last-child {
      font-size: 12px;
      color: b.$ink-2;
    }
    .create {
      justify-content: center;
      align-items: center;
      background: linear-gradient(145deg, #00327d, #00a4e0);
      color: #fff;
    }
    .create strong {
      font-size: 18px;
    }
    .tabs {
      display: flex;
      justify-content: space-around;
      margin: auto -16px 0;
      padding: 12px 0 34px;
      background: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      color: b.$ink-3;
    }
    .tabs .on {
      font-weight: 700;
      color: b.$ink;
    }
  `,
})
export class BentoMobileScreen {
  protected readonly live = LIVE;
  protected readonly rules = RULES;
  protected readonly hours = HOURS;
  protected readonly max = Math.max(...HOURS);
}
