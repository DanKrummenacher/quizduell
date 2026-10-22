// TEMPORARY: concept 6 «Split-View», the rules as grouped settings (development only).
import { Component } from '@angular/core';
import { RULES } from '../mock';
import { SplitSidebarComponent } from './split-sidebar.component';

@Component({
  selector: 'app-split-rules-screen',
  imports: [SplitSidebarComponent],
  template: `
    <div class="app">
      <app-split-sidebar active="regeln" />
      <main>
        <h1>Spielregeln</h1>

        <div class="preview">
          <div class="track">
            @for (n of [1, 2, 3]; track n) {
              <span class="q"></span><span class="r"></span>
            }
          </div>
          <div class="sum">
            <b>{{ rules.duration }}</b
            ><span>dauert ein Duell höchstens</span>
          </div>
        </div>

        <p class="caption">Duell</p>
        <div class="group">
          <div class="cell">
            <span>Fragen pro Duell</span
            ><span class="value">{{ rules.questions }}</span
            ><span class="stepper"><i>−</i><i>+</i></span>
          </div>
          <div class="cell">
            <span>Zeit pro Frage</span
            ><span class="value">{{ rules.seconds }} Sek.</span
            ><span class="stepper"><i>−</i><i>+</i></span>
          </div>
          <div class="cell">
            <span>Auflösung zeigen</span
            ><span class="value">{{ rules.reveal }} Sek.</span
            ><span class="stepper"><i>−</i><i>+</i></span>
          </div>
        </div>
        <p class="foot">
          Mehr Fragen machen ein Duell länger. An einer Messe haben sich 3 bis 5
          Fragen bewährt.
        </p>

        <p class="caption">Punkte</p>
        <div class="group">
          <div class="cell">
            <span>Tempo-Bonus</span><span class="toggle"></span>
          </div>
          <div class="cell">
            <span>Höchstens pro Duell</span
            ><span class="value">{{ rules.maxPoints }} Punkte</span>
          </div>
        </div>
        <p class="foot">
          Mit Tempo-Bonus gibt es für eine schnelle richtige Antwort bis zu 100
          Punkte mehr.
        </p>

        <p class="caption">Nach dem Duell und am Stand</p>
        <div class="group">
          <div class="cell link">
            <span>Zeit für eine Revanche</span
            ><span class="value">{{ rules.rematch }} Sek.</span
            ><span class="chev">›</span>
          </div>
          <div class="cell link">
            <span>Zurück zur Startseite nach</span><span class="value">2 Min.</span
            ><span class="chev">›</span>
          </div>
        </div>

        <div class="group danger">
          <div class="cell">Auf Standardwerte zurücksetzen</div>
        </div>
      </main>
    </div>
  `,
  styles: `
    @use 'split' as s;
    :host {
      display: block;
      width: 1280px;
      height: 800px;
    }
    .app {
      display: grid;
      grid-template-columns: 320px 1fr;
      height: 100%;
      background: s.$bg;
      color: s.$ink;
      font-size: 15px;
    }
    main {
      overflow: hidden;
      padding: 28px 120px 0 64px;
      max-width: 820px;
    }
    h1 {
      margin: 0 0 20px;
      font-size: 30px;
      font-weight: 700;
    }
    .preview {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 26px;
      padding: 18px 20px;
      border-radius: 12px;
      background: s.$ink;
      color: #fff;
    }
    .track {
      display: flex;
      flex: 1;
      gap: 4px;
      height: 12px;
    }
    .q {
      flex: 5;
      border-radius: 6px;
      background: #00a4e0;
    }
    .r {
      flex: 1;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.35);
    }
    .sum {
      display: grid;
      text-align: right;
    }
    .sum b {
      font-size: 22px;
    }
    .sum span {
      font-size: 12px;
      opacity: 0.75;
    }
    .caption {
      @include s.caption;
    }
    .foot {
      @include s.footnote;
      margin-bottom: 24px;
    }
    .group {
      @include s.group;
    }
    .cell {
      @include s.cell;
    }
    .value {
      margin-left: auto;
      color: s.$ink-2;
    }
    .stepper {
      display: flex;
      overflow: hidden;
      border-radius: 8px;
      background: #eef1f6;
    }
    .stepper i {
      display: grid;
      place-items: center;
      width: 40px;
      height: 30px;
      font-style: normal;
      font-size: 18px;
    }
    .stepper i:first-child {
      border-right: 1px solid #d5dbe5;
    }
    .toggle {
      @include s.toggle;
    }
    .chev {
      color: s.$ink-3;
      font-size: 20px;
    }
    .group:not(.danger) + .caption {
      margin-top: 0;
    }
    .danger {
      margin-top: 8px;
    }
    .danger .cell {
      justify-content: center;
      color: s.$red;
    }
  `,
})
export class SplitRulesScreen {
  protected readonly rules = RULES;
}
