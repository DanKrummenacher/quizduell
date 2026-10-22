// TEMPORARY: concept 1 «Studio», the course of a duel as the rules (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { LIVE, RULES } from '../mock';

@Component({
  selector: 'app-studio-flow-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="app">
      <header class="top">
        <span class="brand"
          ><app-concept-brand [inverse]="true" [size]="24" /><em>Studio</em></span
        >
        <nav class="seg">
          <span>Fragen</span><span class="on">Spielablauf</span><span>Live</span>
        </nav>
        <span class="live"><i></i>{{ live.duels }} Duelle laufen</span>
      </header>

      <main class="main">
        <div class="head">
          <div>
            <h1>Spielablauf</h1>
            <p>
              So erleben die Besucher ein Duell. Zieh an den Blöcken, um die Zeiten
              zu ändern.
            </p>
          </div>
          <div class="presets">
            <span>Schnell</span><span class="on">Empfohlen</span
            ><span>Ausführlich</span>
          </div>
        </div>

        <section class="track">
          <div class="lane">
            <div class="block start"><b>Start</b><span>3 s</span></div>
            @for (n of [1, 2, 3]; track n) {
              <div class="block q" [class.focus]="n === 1">
                <b>Frage {{ n }}</b
                ><span>{{ rules.seconds }} s</span>
                @if (n === 1) {
                  <i class="handle"></i>
                }
              </div>
              <div class="block r" title="Auflösung">
                <b>✓</b><span>{{ rules.reveal }} s</span>
              </div>
            }
            <div class="block end">
              <b>Resultat</b><span>Revanche {{ rules.rematch }} s</span>
            </div>
          </div>
          <div class="scale">
            <span>0:00</span><span>0:20</span><span>0:40</span><span>1:00</span
            ><span>1:15</span>
          </div>
        </section>

        <div class="cards">
          <div class="card">
            <span class="label">Fragen pro Duell</span>
            <div class="stepper">
              <i>−</i><b>{{ rules.questions }}</b
              ><i>+</i>
            </div>
            <span class="hint">Aus 31 aktiven Fragen gezogen</span>
          </div>
          <div class="card">
            <span class="label">Zeit pro Frage</span>
            <div class="stepper">
              <i>−</i><b>{{ rules.seconds }}<small>s</small></b
              ><i>+</i>
            </div>
            <span class="hint">Der Balken läuft im Spiel ab</span>
          </div>
          <div class="card">
            <span class="label">Auflösung</span>
            <div class="stepper">
              <i>−</i><b>{{ rules.reveal }}<small>s</small></b
              ><i>+</i>
            </div>
            <span class="hint">Richtige Antwort wird gezeigt</span>
          </div>
          <div class="card accent">
            <span class="label">Tempo-Bonus</span>
            <div class="bonus">
              <span class="switch"><i></i></span><b>An</b>
            </div>
            <span class="hint">Bis {{ rules.maxPoints }} Punkte pro Duell</span>
          </div>
        </div>

        <div class="after">
          <div class="wide">
            <span class="w-icon">↻</span>
            <div>
              <b>Nach dem Duell</b
              ><span
                >Beide haben {{ rules.rematch }} Sekunden, um eine Revanche zu
                fordern.</span
              >
            </div>
            <div class="stepper small">
              <i>−</i><b>{{ rules.rematch }}<small>s</small></b
              ><i>+</i>
            </div>
          </div>
          <div class="wide">
            <span class="w-icon">▣</span>
            <div>
              <b>Geräte am Stand</b
              ><span>Ohne Bedienung zurück zur Startseite nach</span>
            </div>
            <div class="stepper small">
              <i>−</i><b>{{ rules.idle }}<small>s</small></b
              ><i>+</i>
            </div>
          </div>
        </div>

        <footer class="summary">
          <span
            >Ein Duell dauert höchstens <b>{{ rules.duration }}</b> · Stand-Geräte
            setzen sich nach <b>{{ rules.idle }} s</b> zurück</span
          >
          <span class="save">Änderungen übernehmen</span>
        </footer>
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 1280px;
      height: 800px;
    }
    .app {
      display: grid;
      grid-template-rows: 60px 1fr;
      height: 100%;
      background: #f7f7f4;
      color: #00327d;
      font-size: 14px;
    }
    .top {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 0 20px;
      background: #00327d;
      color: #fff;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 300;
    }
    .brand em {
      margin-left: 6px;
      padding: 2px 8px;
      border-radius: 10px;
      background: #00a4e0;
      font-size: 11px;
      font-style: normal;
      font-weight: 700;
    }
    .logo {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3px dotted #fff;
    }
    .seg {
      display: flex;
      gap: 4px;
      margin: 0 auto;
      padding: 4px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.1);
    }
    .seg span {
      padding: 6px 16px;
      border-radius: 16px;
      color: rgba(255, 255, 255, 0.75);
    }
    .seg .on {
      background: #fff;
      color: #00327d;
      font-weight: 700;
    }
    .live {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .live i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00e09d;
      box-shadow: 0 0 0 4px rgba(0, 224, 157, 0.25);
    }

    .main {
      display: flex;
      flex-direction: column;
      gap: 28px;
      padding: 40px 56px;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .head p {
      margin: 6px 0 0;
      color: #4d70a4;
    }
    .presets {
      display: flex;
      gap: 6px;
      padding: 4px;
      border-radius: 22px;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 50, 125, 0.1);
    }
    .presets span {
      padding: 8px 16px;
      border-radius: 18px;
      color: #4d70a4;
    }
    .presets .on {
      background: #00327d;
      color: #fff;
      font-weight: 700;
    }

    .track {
      padding: 28px 28px 18px;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 10px 30px rgba(0, 50, 125, 0.08);
    }
    .lane {
      display: flex;
      gap: 6px;
      height: 96px;
    }
    .block {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      padding: 0 14px;
      border-radius: 10px;
      overflow: hidden;
      color: #fff;
    }
    .block b {
      font-size: 14px;
    }
    .block span {
      font-size: 12px;
      opacity: 0.8;
    }
    .start {
      flex: 3;
      background: #8fa6c8;
    }
    .q {
      flex: 20;
      background: #00327d;
    }
    .q.focus {
      box-shadow:
        0 0 0 3px #fff,
        0 0 0 5px #00a4e0;
    }
    .r {
      flex: 4;
      padding: 0 8px;
      background: #00875e;
    }
    .r b {
      font-size: 16px;
    }
    .end {
      flex: 9;
      background: linear-gradient(135deg, #0078bb, #00a4e0);
    }
    .handle {
      position: absolute;
      right: 4px;
      top: 50%;
      width: 6px;
      height: 36px;
      margin-top: -18px;
      border-radius: 3px;
      background: #fff;
    }
    .scale {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 12px;
      color: #8098be;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .card {
      display: grid;
      gap: 12px;
      padding: 20px;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 50, 125, 0.08);
    }
    .card.accent {
      background: #00327d;
      color: #fff;
    }
    .label {
      font-size: 13px;
      font-weight: 700;
      color: #4d70a4;
    }
    .accent .label,
    .accent .hint {
      color: rgba(255, 255, 255, 0.75);
    }
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .stepper i {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #eef2f7;
      font-style: normal;
      font-size: 20px;
    }
    .stepper b {
      font-size: 40px;
      font-weight: 700;
    }
    .stepper small {
      font-size: 16px;
      color: #8098be;
    }
    .hint {
      font-size: 12px;
      color: #8098be;
    }
    .bonus {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 48px;
      font-size: 24px;
    }
    .switch {
      position: relative;
      width: 52px;
      height: 30px;
      border-radius: 15px;
      background: #00e09d;
    }
    .switch i {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #fff;
    }

    .after {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .wide {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 50, 125, 0.08);
    }
    .wide > div:nth-child(2) {
      flex: 1;
      display: grid;
      gap: 2px;
    }
    .wide > div:nth-child(2) span {
      font-size: 13px;
      color: #4d70a4;
    }
    .w-icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eef2f7;
      font-size: 20px;
    }
    .stepper.small {
      gap: 10px;
    }
    .stepper.small i {
      width: 32px;
      height: 32px;
    }
    .stepper.small b {
      font-size: 26px;
      min-width: 60px;
      text-align: center;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding: 16px 20px;
      border-radius: 14px;
      background: #fff;
      color: #4d70a4;
    }
    .summary b {
      color: #00327d;
    }
    .save {
      padding: 12px 20px;
      border-radius: 22px;
      background: #00327d;
      color: #fff;
      font-weight: 700;
    }
  `,
})
export class StudioFlowScreen {
  protected readonly rules = RULES;
  protected readonly live = LIVE;
}
