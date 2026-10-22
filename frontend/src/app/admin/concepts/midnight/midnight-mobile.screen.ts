// TEMPORARY: concept 4 «Midnight» on the phone (development only).
import { Component } from '@angular/core';
import { LIVE, QUESTIONS } from '../mock';

@Component({
  selector: 'app-midnight-mobile-screen',
  template: `
    <div class="app">
      <header>
        <b>Fragen</b><span class="live"><i></i>{{ live.duels }} live</span>
      </header>
      <div class="search">⌕ Suchen oder Befehl …</div>
      @for (q of questions; track q.id) {
        <div class="row">
          <span class="state" [class.off]="!q.active"></span>
          <div class="text">
            <b>{{ q.text }}</b
            ><span
              >{{ q.category }} ·
              {{ q.rate === null ? 'neu' : q.rate + '% richtig' }}</span
            >
          </div>
        </div>
      }
      <span class="fab">＋</span>
    </div>
  `,
  styles: `
    @use 'midnight' as m;
    :host {
      display: block;
      width: 390px;
      height: 844px;
    }
    .app {
      position: relative;
      height: 100%;
      padding: 56px 16px 0;
      background: m.$bg;
      color: m.$ink;
      font-size: 14px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    header b {
      font-size: 28px;
    }
    .live {
      display: flex;
      align-items: center;
      gap: 6px;
      color: m.$ink-2;
    }
    .live i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: m.$green;
    }
    .search {
      margin: 16px 0 10px;
      padding: 12px 14px;
      border: 1px solid m.$line;
      border-radius: 10px;
      background: m.$panel;
      color: m.$ink-3;
    }
    .row {
      display: flex;
      gap: 12px;
      padding: 12px 4px;
      border-bottom: 1px solid m.$line;
    }
    .state {
      flex: none;
      width: 10px;
      height: 10px;
      margin-top: 5px;
      border-radius: 50%;
      background: m.$green;
    }
    .state.off {
      background: none;
      border: 2px solid m.$ink-3;
    }
    .text {
      display: grid;
      gap: 2px;
    }
    .text span {
      font-size: 12px;
      color: m.$ink-3;
    }
    .fab {
      position: absolute;
      right: 20px;
      bottom: 40px;
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: m.$accent;
      color: m.$bg;
      font-size: 26px;
    }
  `,
})
export class MidnightMobileScreen {
  protected readonly live = LIVE;
  protected readonly questions = QUESTIONS.slice(0, 9);
}
