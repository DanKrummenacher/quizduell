// TEMPORARY: concept 2 «Bento», the overview (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { CATEGORIES, HOURS, LIVE, QUESTIONS, RULES } from '../mock';

@Component({
  selector: 'app-bento-home-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="app">
      <header class="nav">
        <app-concept-brand [size]="26" />
        <nav class="pills">
          <span class="on">Übersicht</span><span>Fragen</span><span>Regeln</span>
        </nav>
        <span class="me">A</span>
      </header>

      <main class="grid">
        <section class="tile today">
          <span class="label">Heute</span>
          <strong class="huge">{{ live.today }}</strong>
          <span class="sub">Duelle · {{ live.total }} seit Beginn</span>
          <div class="chart">
            @for (h of hours; track $index; let i = $index) {
              <i [style.height.%]="(h / max) * 100" [class.now]="i === 9"></i>
            }
          </div>
          <div class="axis">
            <span>9 Uhr</span><span>14 Uhr</span><span>20 Uhr</span>
          </div>
        </section>

        <section class="tile live">
          <span class="label"><i class="dot"></i>Live</span>
          <strong class="big">{{ live.duels }}</strong>
          <span class="sub">Duelle laufen</span>
          <div class="mini">
            <span
              ><b>{{ live.devices }}</b> Geräte</span
            ><span
              ><b>{{ live.searching }}</b> sucht</span
            >
          </div>
        </section>

        <section class="tile ready">
          <span class="check">✓</span>
          <strong>Bereit</strong>
          <span class="sub">{{ live.activeQuestions }} Fragen im Spiel</span>
        </section>

        <section class="tile rate">
          <span class="label">Richtig</span>
          <div class="donut" style="--v: 58">
            <b>58<small>%</small></b>
          </div>
          <span class="sub">aus {{ live.answers }} Antworten</span>
        </section>

        <section class="tile rules">
          <span class="label">Spielregeln</span>
          <strong class="big"
            >{{ rules.questions }}<small>×</small>{{ rules.seconds
            }}<small>s</small></strong
          >
          <span class="sub">Duell max. {{ rules.duration }} · Tempo-Bonus an</span>
          <span class="link">Ändern →</span>
        </section>

        <section class="tile hard">
          <span class="label">Braucht einen Blick</span>
          <p class="q">«{{ hard.text }}»</p>
          <div class="hard-row">
            <span class="pct">{{ hard.rate }} %</span>
            <span class="sub"
              >richtig nach {{ hard.asked }} Antworten – stimmt die Lösung?</span
            >
            <span class="btn">Prüfen</span>
          </div>
        </section>

        <section class="tile cats">
          <span class="label">Kategorien</span>
          @for (c of categories; track c.name) {
            <div class="cat">
              <span>{{ c.name }}</span>
              <span class="track"><i [style.width.%]="c.rate"></i></span>
              <b>{{ c.rate }}%</b>
            </div>
          }
        </section>

        <section class="tile create">
          <span class="plus">＋</span>
          <strong>Neue Frage</strong>
          <span>oder 30 auf einmal aus Excel</span>
        </section>
      </main>
    </div>
  `,
  styles: `
    @use 'bento' as b;
    :host {
      display: block;
      width: 1280px;
      height: 800px;
    }
    .app {
      height: 100%;
      background: b.$bg;
      color: b.$ink;
      font-size: 14px;
    }
    .nav {
      @include b.nav;
    }
    .pills {
      @include b.pills;
    }
    .me {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: b.$blue;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: 230px 190px 190px;
      gap: 16px;
      padding: 4px 32px 32px;
    }
    .tile {
      @include b.tile;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 22px 24px;
      overflow: hidden;
    }
    .label {
      @include b.label;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sub {
      font-size: 13px;
      color: b.$ink-2;
    }
    .big {
      margin-top: auto;
      font-size: 64px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .big small {
      font-size: 28px;
      color: b.$ink-3;
      letter-spacing: 0;
    }
    .huge {
      font-size: 96px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.04em;
      margin-top: 6px;
    }

    .today {
      grid-column: span 2;
      grid-row: span 2;
    }
    .chart {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 150px;
      margin-top: auto;
    }
    .chart i {
      flex: 1;
      border-radius: 6px 6px 2px 2px;
      background: #dfe6f1;
    }
    .chart i.now {
      background: b.$cyan;
    }
    .axis {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: b.$ink-3;
    }

    .live {
      background: b.$blue;
      color: #fff;
    }
    .live .label,
    .live .sub {
      color: rgba(255, 255, 255, 0.7);
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: b.$mint;
      box-shadow: 0 0 0 4px rgba(0, 224, 157, 0.25);
    }
    .mini {
      display: flex;
      gap: 16px;
      margin-top: 10px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.75);
    }
    .mini b {
      color: #fff;
    }

    .ready {
      align-items: flex-start;
      justify-content: flex-end;
      background: linear-gradient(160deg, #e3f6ee, #fff 70%);
    }
    .check {
      position: absolute;
      top: 22px;
      right: 22px;
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: b.$green;
      color: #fff;
      font-size: 22px;
    }
    .ready strong {
      font-size: 34px;
      color: b.$green;
    }

    .rate {
      align-items: center;
      text-align: center;
    }
    .rate .label {
      align-self: flex-start;
    }
    .donut {
      display: grid;
      place-items: center;
      width: 110px;
      height: 110px;
      margin: 4px 0 8px;
      border-radius: 50%;
      background: conic-gradient(b.$green calc(var(--v) * 1%), #eceef2 0);
    }
    .donut b {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1px;
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: #fff;
      font-size: 28px;
    }
    .donut small {
      font-size: 14px;
      color: b.$ink-3;
    }

    .rules .link {
      position: absolute;
      top: 22px;
      right: 24px;
      font-size: 13px;
      font-weight: 700;
      color: b.$cyan;
    }

    .hard {
      grid-column: span 2;
    }
    .q {
      margin: 10px 0 auto;
      font-size: 22px;
      line-height: 1.3;
    }
    .hard-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .pct {
      padding: 8px 12px;
      border-radius: 12px;
      background: #fdecea;
      font-size: 20px;
      font-weight: 700;
      color: b.$red;
    }
    .hard-row .sub {
      flex: 1;
    }
    .btn {
      padding: 10px 18px;
      border-radius: 20px;
      background: b.$blue;
      color: #fff;
      font-weight: 700;
    }

    .cats {
      gap: 10px;
    }
    .cat {
      display: grid;
      grid-template-columns: 1fr 70px 36px;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .track {
      height: 6px;
      border-radius: 3px;
      background: #eceef2;
      overflow: hidden;
    }
    .track i {
      display: block;
      height: 100%;
      background: b.$blue;
      border-radius: 3px;
    }
    .cat b {
      text-align: right;
    }

    .create {
      justify-content: flex-end;
      background: linear-gradient(145deg, #00327d, #0078bb 60%, #00a4e0);
      color: #fff;
    }
    .plus {
      position: absolute;
      top: 18px;
      right: 20px;
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.18);
      font-size: 28px;
    }
    .create strong {
      font-size: 26px;
    }
    .create span:last-child {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.75);
    }
  `,
})
export class BentoHomeScreen {
  protected readonly live = LIVE;
  protected readonly rules = RULES;
  protected readonly hours = HOURS;
  protected readonly max = Math.max(...HOURS);
  protected readonly categories = CATEGORIES;
  protected readonly hard = QUESTIONS.find((q) => q.id === 6)!;
}
