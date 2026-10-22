// TEMPORARY: concept 3 «Pro», the overview (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { CATEGORIES, HOURS, LIVE } from '../mock';

@Component({
  selector: 'app-pro-home-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="shell">
      <aside class="side">
        <app-concept-brand [size]="22" class="brand" />
        <span class="item on">◧ Übersicht</span>
        <span class="item">☰ Fragen <em>32</em></span>
        <span class="item">⚙ Spielregeln</span>
        <span class="group">Kategorien</span>
        @for (c of categories; track c.name) {
          <span class="item"
            >▪ {{ c.name }} <em>{{ c.total }}</em></span
          >
        }
        <span class="item foot">↗ Zum Spiel</span>
      </aside>
      <div class="main">
        <header class="top">
          <span class="search">⌕ Suchen … <kbd>⌘K</kbd></span>
          <span class="status"><i></i>Spiel läuft · {{ live.devices }} Geräte</span>
        </header>
        <div class="page">
          <div class="head">
            <h1>Übersicht</h1>
            <div class="actions">
              <span class="range">Heute ▾</span>
              <span class="btn">Exportieren</span>
              <span class="btn primary">＋ Frage</span>
            </div>
          </div>

          <div class="kpis">
            <div class="kpi">
              <span>Duelle</span><b>{{ live.today }}</b>
              <em class="up">+12 % ggü. gestern</em>
              <svg viewBox="0 0 100 28" preserveAspectRatio="none">
                <path
                  d="M0 22 L10 20 L20 21 L30 15 L40 17 L50 12 L60 13 L70 8 L80 10 L90 5 L100 6"
                />
              </svg>
            </div>
            <div class="kpi">
              <span>Spieler</span><b>{{ live.today * 2 }}</b>
              <em class="up">+9 %</em>
              <svg viewBox="0 0 100 28" preserveAspectRatio="none">
                <path
                  d="M0 20 L10 21 L20 18 L30 18 L40 14 L50 15 L60 11 L70 12 L80 9 L90 9 L100 7"
                />
              </svg>
            </div>
            <div class="kpi">
              <span>Richtig beantwortet</span><b>{{ live.rate }} %</b>
              <em class="down">−3 Pkt.</em>
              <svg viewBox="0 0 100 28" preserveAspectRatio="none">
                <path
                  d="M0 10 L10 12 L20 11 L30 14 L40 12 L50 15 L60 14 L70 16 L80 15 L90 17 L100 16"
                />
              </svg>
            </div>
            <div class="kpi">
              <span>Ø Duelldauer</span><b>58 s</b>
              <em>max. 1:15 Min.</em>
              <svg viewBox="0 0 100 28" preserveAspectRatio="none">
                <path
                  d="M0 14 L10 15 L20 13 L30 14 L40 14 L50 13 L60 15 L70 14 L80 13 L90 14 L100 14"
                />
              </svg>
            </div>
          </div>

          <div class="panels">
            <section class="panel chart">
              <div class="p-head">
                <b>Duelle pro Stunde</b><span>Heute · 84</span>
              </div>
              <div class="bars">
                @for (h of hours; track $index; let i = $index) {
                  <div class="col">
                    <i [style.height.%]="(h / max) * 100"></i
                    ><span>{{ 9 + i }}</span>
                  </div>
                }
              </div>
            </section>
            <section class="panel">
              <div class="p-head">
                <b>Zu prüfen</b><span class="link">Alle ansehen</span>
              </div>
              <ul class="checks">
                <li>
                  <span class="tag red">Zu schwer</span
                  ><span>Ein Hirte hat 17 Schafe …</span><b>12 %</b>
                </li>
                <li>
                  <span class="tag red">Zu schwer</span
                  ><span>Was wird nass, während …</span><b>17 %</b>
                </li>
                <li>
                  <span class="tag amber">Zu leicht</span
                  ><span>Wie viele Bits hat ein Byte?</span><b>93 %</b>
                </li>
                <li>
                  <span class="tag grey">Neu</span
                  ><span>Was ist ein «Bug» in der …</span><b>–</b>
                </li>
              </ul>
            </section>
          </div>

          <section class="panel table">
            <div class="p-head">
              <b>Kategorien</b><span class="link">Verwalten</span>
            </div>
            <div class="tr th">
              <span>Name</span><span>Fragen</span><span>Im Spiel</span
              ><span>Richtig</span><span>Gestellt</span>
            </div>
            @for (c of categories; track c.name) {
              <div class="tr">
                <span
                  ><b>{{ c.name }}</b></span
                ><span>{{ c.total }}</span
                ><span>{{ c.active }}</span
                ><span
                  ><i class="meter"><i [style.width.%]="c.rate"></i></i
                  >{{ c.rate }} %</span
                ><span>{{ c.total * 47 }}</span>
              </div>
            }
          </section>
        </div>
      </div>
    </div>
  `,
  styles: `
    @use 'pro' as p;
    :host {
      display: block;
      width: 1280px;
      height: 800px;
    }
    .shell {
      @include p.shell;
    }
    .side {
      @include p.side;
    }
    .brand {
      margin: 2px 10px 18px;
    }
    .side em {
      margin-left: auto;
      font-style: normal;
      color: p.$ink-3;
    }
    .foot {
      margin-top: auto;
    }
    .main {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .top {
      @include p.topbar;
    }
    kbd {
      float: right;
      font: inherit;
      font-size: 11px;
      color: p.$ink-3;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      color: p.$ink-2;
    }
    .status i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #18b37e;
    }
    .page {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: -0.01em;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .range,
    .btn {
      @include p.button;
    }
    .btn.primary {
      @include p.button(true);
    }

    .kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border: 1px solid p.$line;
      border-radius: 10px;
    }
    .kpi {
      display: grid;
      gap: 4px;
      padding: 16px 18px;
      border-right: 1px solid p.$line;
    }
    .kpi:last-child {
      border-right: 0;
    }
    .kpi span {
      color: p.$ink-2;
    }
    .kpi b {
      font-size: 26px;
      letter-spacing: -0.02em;
    }
    .kpi em {
      font-style: normal;
      font-size: 12px;
      color: p.$ink-3;
    }
    .kpi em.up {
      color: p.$green;
    }
    .kpi em.down {
      color: p.$red;
    }
    .kpi svg {
      width: 100%;
      height: 28px;
      margin-top: 4px;
    }
    .kpi path {
      fill: none;
      stroke: p.$accent;
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }

    .panels {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
    }
    .panel {
      border: 1px solid p.$line;
      border-radius: 10px;
    }
    .p-head {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid p.$line;
    }
    .p-head span {
      color: p.$ink-3;
    }
    .link {
      color: p.$accent !important;
      font-weight: 700;
    }
    .bars {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      height: 150px;
      padding: 16px 16px 10px;
    }
    .col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      height: 100%;
      justify-content: flex-end;
    }
    .col i {
      width: 100%;
      max-width: 24px;
      border-radius: 4px 4px 0 0;
      background: p.$accent;
    }
    .col span {
      font-size: 11px;
      color: p.$ink-3;
    }
    .checks {
      margin: 0;
      padding: 6px 0;
      list-style: none;
    }
    .checks li {
      display: grid;
      grid-template-columns: 80px 1fr 40px;
      align-items: center;
      gap: 10px;
      padding: 9px 16px;
    }
    .checks b {
      text-align: right;
    }
    .tag {
      justify-self: start;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
    }
    .tag.red {
      background: p.$red-soft;
      color: p.$red;
    }
    .tag.amber {
      background: #fdf3dc;
      color: #95600a;
    }
    .tag.grey {
      background: #eef0f3;
      color: p.$ink-2;
    }
    .tr {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.6fr 1fr;
      align-items: center;
      padding: 10px 16px;
      border-top: 1px solid p.$line;
    }
    .th {
      border-top: 0;
      font-size: 11px;
      font-weight: 700;
      color: p.$ink-3;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .meter {
      display: inline-block;
      width: 60px;
      height: 4px;
      margin-right: 8px;
      border-radius: 2px;
      background: #eef0f3;
      vertical-align: middle;
      overflow: hidden;
    }
    .meter i {
      display: block;
      height: 100%;
      background: p.$green;
    }
  `,
})
export class ProHomeScreen {
  protected readonly live = LIVE;
  protected readonly categories = CATEGORIES;
  protected readonly hours = HOURS;
  protected readonly max = Math.max(...HOURS);
}
