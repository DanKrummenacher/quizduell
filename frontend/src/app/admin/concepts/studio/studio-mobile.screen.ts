// TEMPORARY: concept 1 «Studio» on the phone (development only).
import { Component } from '@angular/core';
import { LETTERS, QUESTIONS } from '../mock';

@Component({
  selector: 'app-studio-mobile-screen',
  template: `
    <div class="app">
      <header class="top">
        <span class="back">‹ Schweiz</span>
        <b>Frage 2 von 5</b>
        <span class="done">Fertig</span>
      </header>
      <div class="strip">
        @for (q of strip; track q.id; let i = $index) {
          <span class="thumb" [class.on]="i === 1">
            <i>{{ i + 1 }}</i>
            <span class="lines">
              @for (o of q.options; track $index; let j = $index) {
                <em [class.ok]="j === q.correct"></em>
              }
            </span>
          </span>
        }
        <span class="thumb add">＋</span>
      </div>
      <main class="canvas">
        <h1>Welches ist der höchste Berg der Schweiz?</h1>
        @for (o of current.options; track $index; let j = $index) {
          <div class="answer" [class.ok]="j === current.correct">
            <span class="letter">{{ letters[j] }}</span
            ><span>{{ o }}</span>
            @if (j === current.correct) {
              <span class="tick">✓</span>
            }
          </div>
        }
      </main>
      <section class="sheet">
        <i class="grab"></i>
        <div class="row"><span>Kategorie</span><b>Schweiz ›</b></div>
        <div class="row">
          <span>Im Spiel</span><span class="switch"><i></i></span>
        </div>
        <div class="row">
          <span>Trefferquote</span><b class="amber">38 % · 37×</b>
        </div>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 390px;
      height: 844px;
    }
    .app {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding-top: 44px;
      background: #f7f7f4;
      color: #00327d;
      font-size: 15px;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
    }
    .back,
    .done {
      color: #0078bb;
    }
    .done {
      font-weight: 700;
    }
    .strip {
      display: flex;
      gap: 8px;
      padding: 8px 16px 14px;
      overflow: hidden;
    }
    .thumb {
      position: relative;
      flex: none;
      display: grid;
      place-items: center;
      width: 64px;
      height: 48px;
      border: 2px solid #dfe6f0;
      border-radius: 8px;
      background: #fff;
    }
    .thumb.on {
      border-color: #00327d;
    }
    .thumb i {
      position: absolute;
      top: 2px;
      left: 5px;
      font-size: 9px;
      font-style: normal;
      color: #8098be;
    }
    .lines {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px;
      width: 40px;
      margin-top: 8px;
    }
    .lines em {
      height: 5px;
      border-radius: 2px;
      background: #c9d4e4;
    }
    .lines em.ok {
      background: #00875e;
    }
    .thumb.add {
      border-style: dashed;
      font-size: 20px;
      color: #8098be;
    }
    .canvas {
      flex: 1;
      display: grid;
      align-content: start;
      gap: 10px;
      padding: 8px 20px;
    }
    h1 {
      margin: 6px 0 14px;
      font-size: 26px;
      font-weight: 300;
      line-height: 1.2;
    }
    .answer {
      position: relative;
      display: flex;
      align-items: center;
      height: 60px;
      overflow: hidden;
      border: 1px solid #8098be;
      border-radius: 4px;
      background: #fff;
      font-weight: 700;
    }
    .answer.ok {
      background: #00875e;
      border-color: #00875e;
      color: #fff;
    }
    .letter {
      display: grid;
      place-items: center;
      align-self: stretch;
      width: 54px;
      margin-right: 14px;
      background: #00327d;
      color: #fff;
    }
    .ok .letter {
      background: rgba(255, 255, 255, 0.16);
    }
    .tick {
      position: absolute;
      right: 14px;
    }
    .sheet {
      padding: 8px 20px 34px;
      border-radius: 22px 22px 0 0;
      background: #fff;
      box-shadow: 0 -8px 24px rgba(0, 50, 125, 0.1);
    }
    .grab {
      display: block;
      width: 36px;
      height: 5px;
      margin: 0 auto 8px;
      border-radius: 3px;
      background: #c9d4e4;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 48px;
      border-bottom: 1px solid #eef2f7;
    }
    .row:last-child {
      border-bottom: 0;
    }
    .amber {
      color: #b07400;
    }
    .switch {
      position: relative;
      width: 50px;
      height: 30px;
      border-radius: 15px;
      background: #00875e;
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
  `,
})
export class StudioMobileScreen {
  protected readonly strip = QUESTIONS.slice(0, 4);
  protected readonly current = QUESTIONS[1]!;
  protected readonly letters = LETTERS;
}
