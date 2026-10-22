// TEMPORARY: concept 4 «Midnight», the command menu over the overview (development only).
import { Component } from '@angular/core';
import { HOURS, LIVE } from '../mock';

@Component({
  selector: 'app-midnight-command-screen',
  template: `
    <div class="app">
      <div class="behind">
        <h1>Übersicht</h1>
        <div class="stats">
          <div>
            <span>Duelle heute</span><b>{{ live.today }}</b>
          </div>
          <div>
            <span>Live</span><b>{{ live.duels }}</b>
          </div>
          <div>
            <span>Richtig</span><b>{{ live.rate }}%</b>
          </div>
          <div>
            <span>Fragen aktiv</span><b>{{ live.activeQuestions }}</b>
          </div>
        </div>
        <div class="chart">
          @for (h of hours; track $index) {
            <i [style.height.%]="(h / max) * 100"></i>
          }
        </div>
      </div>
      <div class="dim"></div>
      <div class="palette">
        <div class="line">
          <span>⌕</span>tempo<i class="caret"></i><kbd>Esc</kbd>
        </div>
        <div class="group">Spielregeln</div>
        <div class="item on">
          <span class="icon">⚡</span>Tempo-Bonus ausschalten<em
            >sofort wirksam ab nächstem Duell</em
          ><kbd>↵</kbd>
        </div>
        <div class="item">
          <span class="icon">⏱</span>Zeit pro Frage ändern<em>20 s</em>
        </div>
        <div class="group">Fragen</div>
        <div class="item">
          <span class="icon">?</span>Welche Zahl fehlt in der Reihe? …<em>Logik</em>
        </div>
        <div class="group">Aktionen</div>
        <div class="item"><span class="icon">＋</span>Neue Frage<kbd>C</kbd></div>
        <div class="item"><span class="icon">⇩</span>Fragen als CSV exportieren</div>
        <div class="foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> wählen</span
          ><span><kbd>↵</kbd> ausführen</span><span><kbd>⌘K</kbd> überall</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    @use 'midnight' as m;
    :host {
      display: block;
      width: 1280px;
      height: 800px;
    }
    .app {
      position: relative;
      height: 100%;
      background: m.$bg;
      color: m.$ink;
      font-size: 14px;
      overflow: hidden;
    }
    kbd {
      @include m.kbd;
      font-family: inherit;
    }
    .behind {
      padding: 40px 56px;
    }
    h1 {
      margin: 0 0 24px;
      font-size: 26px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .stats div {
      display: grid;
      gap: 4px;
      padding: 18px;
      border: 1px solid m.$line;
      border-radius: 10px;
      background: m.$panel;
    }
    .stats span {
      color: m.$ink-3;
    }
    .stats b {
      font-size: 32px;
    }
    .chart {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      height: 260px;
      margin-top: 24px;
      padding: 20px;
      border: 1px solid m.$line;
      border-radius: 10px;
    }
    .chart i {
      flex: 1;
      border-radius: 4px 4px 0 0;
      background: linear-gradient(m.$accent, rgba(63, 182, 255, 0.2));
    }
    .dim {
      position: absolute;
      inset: 0;
      background: rgba(5, 9, 18, 0.6);
      backdrop-filter: blur(3px);
    }
    .palette {
      position: absolute;
      top: 120px;
      left: 50%;
      width: 640px;
      transform: translateX(-50%);
      border: 1px solid m.$line;
      border-radius: 14px;
      background: m.$panel;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
      overflow: hidden;
    }
    .line {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 58px;
      padding: 0 18px;
      border-bottom: 1px solid m.$line;
      font-size: 18px;
    }
    .line span {
      color: m.$ink-3;
    }
    .line kbd {
      margin-left: auto;
    }
    .caret {
      width: 2px;
      height: 22px;
      margin-left: -10px;
      background: m.$accent;
    }
    .group {
      padding: 12px 18px 4px;
      font-size: 11px;
      font-weight: 700;
      color: m.$ink-3;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 40px;
      margin: 0 6px;
      padding: 0 12px;
      border-radius: 8px;
      color: m.$ink-2;
    }
    .item.on {
      background: m.$raised;
      color: m.$ink;
    }
    .icon {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: m.$line;
      font-size: 12px;
    }
    .item em {
      margin-left: auto;
      font-style: normal;
      font-size: 12px;
      color: m.$ink-3;
    }
    .foot {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      padding: 10px 18px;
      border-top: 1px solid m.$line;
      font-size: 12px;
      color: m.$ink-3;
    }
  `,
})
export class MidnightCommandScreen {
  protected readonly live = LIVE;
  protected readonly hours = HOURS;
  protected readonly max = Math.max(...HOURS);
}
