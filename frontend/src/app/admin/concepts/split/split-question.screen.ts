// TEMPORARY: concept 6 «Split-View», list and question detail (development only).
import { Component } from '@angular/core';
import { LETTERS, QUESTIONS } from '../mock';
import { SplitSidebarComponent } from './split-sidebar.component';

@Component({
  selector: 'app-split-question-screen',
  imports: [SplitSidebarComponent],
  template: `
    <div class="app">
      <app-split-sidebar active="Schweiz" />
      <section class="list">
        <header><b>Schweiz</b><span class="add">＋</span></header>
        @for (q of questions; track q.id) {
          <div class="row" [class.on]="q.id === current.id">
            <b>{{ q.text }}</b>
            <span>{{ q.rate }} % richtig · {{ q.asked }}× gestellt</span>
          </div>
        }
      </section>
      <main>
        <header class="bar"><span class="done">Fertig</span></header>
        <p class="caption">Frage</p>
        <div class="group">
          <div class="cell text">{{ current.text }}</div>
        </div>

        <p class="caption">Antworten · tippe auf die richtige</p>
        <div class="group">
          @for (o of current.options; track $index; let j = $index) {
            <div class="cell">
              <span class="letter">{{ letters[j] }}</span
              >{{ o }}
              @if (j === current.correct) {
                <span class="check">✓</span>
              }
            </div>
          }
        </div>

        <p class="caption">Einstellungen</p>
        <div class="group">
          <div class="cell"><span>Im Spiel</span><span class="toggle"></span></div>
          <div class="cell">
            <span>Kategorie</span><span class="value">Schweiz</span
            ><span class="chev">›</span>
          </div>
        </div>

        <p class="caption">Im Spiel</p>
        <div class="group stats">
          <div>
            <b>{{ current.asked }}×</b><span>gestellt</span>
          </div>
          <div>
            <b class="amber">{{ current.rate }} %</b><span>richtig</span>
          </div>
          <div><b>12 Sek.</b><span>Ø Antwortzeit</span></div>
        </div>
        <p class="foot">
          Eher schwierig – gut für Abwechslung. Unter 20 % schlägt das Admin vor, die
          Frage zu prüfen.
        </p>

        <div class="group danger"><div class="cell">Frage löschen</div></div>
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
      grid-template-columns: 300px 340px 1fr;
      height: 100%;
      background: s.$bg;
      color: s.$ink;
      font-size: 15px;
    }
    .list {
      overflow: hidden;
      border-right: 1px solid s.$line;
      background: #fff;
    }
    .list header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 26px 20px 12px;
    }
    .list header b {
      font-size: 26px;
    }
    .add {
      color: s.$blue;
      font-size: 24px;
    }
    .row {
      display: grid;
      gap: 3px;
      margin: 0 10px;
      padding: 12px 12px;
      border-radius: 10px;
    }
    .row + .row {
      box-shadow: 0 -1px 0 s.$line;
    }
    .row b {
      font-weight: 500;
      line-height: 1.3;
    }
    .row span {
      font-size: 13px;
      color: s.$ink-3;
    }
    .row.on {
      background: s.$blue;
      color: #fff;
      box-shadow: none;
    }
    .row.on span {
      color: rgba(255, 255, 255, 0.8);
    }
    .row.on + .row {
      box-shadow: none;
    }
    main {
      overflow: hidden;
      padding: 0 56px;
    }
    .bar {
      display: flex;
      justify-content: flex-end;
      height: 64px;
      align-items: center;
    }
    .done {
      color: s.$blue;
      font-weight: 700;
    }
    .caption {
      @include s.caption;
    }
    .foot {
      @include s.footnote;
    }
    .group {
      @include s.group;
      margin-bottom: 22px;
    }
    .foot + .group,
    .group + .group {
      margin-top: 0;
    }
    .cell {
      @include s.cell;
    }
    .cell.text {
      padding: 14px 16px;
      font-size: 18px;
      line-height: 1.35;
    }
    .letter {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border-radius: 4px;
      background: s.$ink;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
    }
    .check {
      margin-left: auto;
      color: s.$green;
      font-size: 18px;
      font-weight: 700;
    }
    .toggle {
      @include s.toggle;
    }
    .value {
      margin-left: auto;
      color: s.$ink-2;
    }
    .chev {
      color: s.$ink-3;
      font-size: 20px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      margin-bottom: 0;
    }
    .stats div {
      display: grid;
      gap: 2px;
      padding: 14px 16px;
    }
    .stats div + div {
      border-left: 1px solid s.$line;
    }
    .stats b {
      font-size: 22px;
    }
    .stats span {
      font-size: 12px;
      color: s.$ink-3;
    }
    .amber {
      color: #c98a00;
    }
    .danger {
      margin-top: 26px;
    }
    .danger .cell {
      justify-content: center;
      color: s.$red;
    }
  `,
})
export class SplitQuestionScreen {
  protected readonly letters = LETTERS;
  protected readonly questions = QUESTIONS.filter((q) => q.category === 'Schweiz');
  protected readonly current = QUESTIONS[1]!;
}
