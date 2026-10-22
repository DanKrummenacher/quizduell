// TEMPORARY: concept 3 «Pro», the rules as a settings page (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { RULES } from '../mock';

@Component({
  selector: 'app-pro-settings-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="shell">
      <aside class="side">
        <app-concept-brand [size]="22" class="brand" />
        <span class="item">◧ Übersicht</span>
        <span class="item">☰ Fragen <em>32</em></span>
        <span class="item on">⚙ Spielregeln</span>
      </aside>
      <div class="main">
        <header class="top">
          <span class="search">⌕ Suchen … <kbd>⌘K</kbd></span>
        </header>
        <div class="page">
          <h1>Spielregeln</h1>
          <p class="lead">
            Gelten ab dem nächsten Duell. Jede Änderung wird protokolliert.
          </p>

          <section class="sec">
            <div class="sec-text">
              <b>Duell</b
              ><span>Wie viele Fragen und wie viel Zeit die Spieler bekommen.</span>
            </div>
            <div class="sec-form">
              <div class="field">
                <span class="lbl">Fragen pro Duell</span
                ><span class="input">{{ rules.questions }}</span>
              </div>
              <div class="field">
                <span class="lbl">Sekunden pro Frage</span
                ><span class="input">{{ rules.seconds }}<em>s</em></span>
              </div>
              <div class="field">
                <span class="lbl">Auflösung</span
                ><span class="input dirty">5<em>s</em></span
                ><small>Vorher 4 s</small>
              </div>
              <div class="field row">
                <div>
                  <span class="lbl">Tempo-Bonus</span
                  ><small>Bis zu 100 Punkte mehr für schnelle Antworten</small>
                </div>
                <span class="toggle"><i></i></span>
              </div>
            </div>
          </section>
          <section class="sec">
            <div class="sec-text">
              <b>Nach dem Duell</b><span>Zeit für eine Revanche.</span>
            </div>
            <div class="sec-form">
              <div class="field">
                <span class="lbl">Sekunden für die Revanche</span
                ><span class="input">{{ rules.rematch }}<em>s</em></span>
              </div>
            </div>
          </section>
          <section class="sec">
            <div class="sec-text">
              <b>Geräte am Stand</b
              ><span>Zurück zur Startseite, wenn niemand spielt.</span>
            </div>
            <div class="sec-form">
              <div class="field">
                <span class="lbl">Zurücksetzen nach</span
                ><span class="input">{{ rules.idle }}<em>s</em></span>
              </div>
            </div>
          </section>
        </div>
        <footer class="bar">
          <span
            >1 ungespeicherte Änderung · Ein Duell dauert dann höchstens
            <b>1:18 Min.</b></span
          >
          <span class="btn">Verwerfen</span
          ><span class="btn primary">Speichern</span>
        </footer>
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
    .page {
      flex: 1;
      max-width: 900px;
      padding: 28px 28px 0;
    }
    h1 {
      margin: 0;
      font-size: 24px;
    }
    .lead {
      margin: 4px 0 20px;
      color: p.$ink-2;
    }
    .sec {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 32px;
      padding: 22px 0;
      border-top: 1px solid p.$line;
    }
    .sec-text {
      display: grid;
      gap: 4px;
      align-content: start;
    }
    .sec-text span {
      color: p.$ink-2;
      line-height: 1.5;
    }
    .sec-form {
      display: grid;
      gap: 14px;
      padding: 18px;
      border: 1px solid p.$line;
      border-radius: 10px;
    }
    .field {
      display: grid;
      gap: 6px;
    }
    .field.row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid p.$line;
    }
    .field.row div {
      display: grid;
      gap: 2px;
    }
    .lbl {
      font-weight: 700;
    }
    small {
      color: p.$ink-3;
    }
    .input {
      width: 160px;
      padding: 7px 10px;
      border: 1px solid #cfd6e1;
      border-radius: 6px;
    }
    .input em {
      float: right;
      font-style: normal;
      color: p.$ink-3;
    }
    .input.dirty {
      border-color: #e0a100;
      box-shadow: 0 0 0 3px #fdf3dc;
    }
    .toggle {
      position: relative;
      width: 36px;
      height: 20px;
      border-radius: 10px;
      background: p.$green;
    }
    .toggle i {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 28px;
      border-top: 1px solid p.$line;
      background: #fffbef;
    }
    .bar span:first-child {
      flex: 1;
      color: p.$ink-2;
    }
    .btn {
      @include p.button;
    }
    .btn.primary {
      @include p.button(true);
    }
  `,
})
export class ProSettingsScreen {
  protected readonly rules = RULES;
}
