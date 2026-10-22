// TEMPORARY: concept 1 «Studio», the question editor (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { CATEGORIES, LETTERS, LIVE, QUESTIONS } from '../mock';

@Component({
  selector: 'app-studio-editor-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="app">
      <header class="top">
        <span class="brand"
          ><app-concept-brand [inverse]="true" [size]="24" /><em>Studio</em></span
        >
        <nav class="seg">
          <span class="on">Fragen</span><span>Spielablauf</span><span>Live</span>
        </nav>
        <span class="live"><i></i>{{ live.duels }} Duelle laufen</span>
      </header>

      <aside class="rail">
        <div class="rail-head">
          <span class="select">Alle Kategorien <i>▾</i></span>
          <span class="count">32</span>
        </div>
        <ol class="slides">
          @for (q of questions; track q.id; let i = $index) {
            <li class="slide" [class.on]="i === 1" [class.off]="!q.active">
              <span class="no">{{ i + 1 }}</span>
              <span class="mini">
                <span class="mini-q">{{ q.text }}</span>
                <span class="mini-a">
                  @for (o of q.options; track $index; let j = $index) {
                    <i [class.ok]="j === q.correct"></i>
                  }
                </span>
              </span>
            </li>
          }
        </ol>
        <span class="add">＋ Neue Frage</span>
      </aside>

      <main class="canvas">
        <div class="meta">
          <span class="chip">Frage 2</span><span class="chip ghost">Schweiz</span>
        </div>
        <h1 class="question">
          Welches ist der höchste Berg der Schweiz?<i class="caret"></i>
        </h1>
        <div class="answers">
          @for (o of current.options; track $index; let j = $index) {
            <div class="answer" [class.ok]="j === current.correct">
              <span class="letter">{{ letters[j] }}</span>
              <span class="text">{{ o }}</span>
              @if (j === current.correct) {
                <span class="tick">✓ richtig</span>
              }
            </div>
          }
        </div>
        <p class="hint">
          Antwort anklicken, um sie als richtig zu markieren · Text direkt bearbeiten
        </p>
      </main>

      <aside class="props">
        <h2>Eigenschaften</h2>
        <div class="field">
          <span>Kategorie</span><b>Schweiz <i>▾</i></b>
        </div>
        <div class="row">
          <span>Im Spiel</span><span class="switch on"><i></i></span>
        </div>
        <div class="row"><span>Zeit für diese Frage</span><b>20 s</b></div>

        <h2>So läuft sie</h2>
        <div class="stat">
          <div class="ring" style="--v: 38"><b>38 %</b></div>
          <div class="stat-text">
            <b>Eher schwer</b>
            <span>37× gestellt · häufigster Fehler: «Matterhorn» (44 %)</span>
          </div>
        </div>
        <div class="dist">
          @for (d of distribution; track d.l) {
            <div class="bar">
              <span>{{ d.l }}</span
              ><i [style.width.%]="d.v" [class.ok]="d.ok"></i><em>{{ d.v }} %</em>
            </div>
          }
        </div>

        <div class="actions">
          <span>Duplizieren</span><span class="danger">Löschen</span>
        </div>
        <p class="saved">✓ Automatisch gespeichert</p>
      </aside>
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
      grid-template-columns: 260px 1fr 300px;
      grid-template-rows: 60px 1fr;
      height: 100%;
      background: #eef2f7;
      color: #00327d;
      font-size: 14px;
    }
    .top {
      grid-column: 1 / -1;
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
    .brand b {
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

    .rail {
      display: flex;
      flex-direction: column;
      min-height: 0;
      background: #fff;
      border-right: 1px solid #e1e7f0;
    }
    .rail-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid #e1e7f0;
    }
    .select {
      font-weight: 700;
    }
    .select i {
      font-style: normal;
      color: #8098be;
    }
    .count {
      padding: 2px 8px;
      border-radius: 10px;
      background: #eef2f7;
      font-size: 12px;
      font-weight: 700;
    }
    .slides {
      flex: 1;
      margin: 0;
      padding: 10px;
      overflow: hidden;
      list-style: none;
      display: grid;
      align-content: start;
      gap: 8px;
    }
    .slide {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .no {
      width: 18px;
      padding-top: 6px;
      font-size: 11px;
      color: #8098be;
      text-align: right;
    }
    .mini {
      flex: 1;
      display: grid;
      gap: 6px;
      padding: 8px 10px;
      border: 2px solid #e1e7f0;
      border-radius: 8px;
      background: #f7f9fc;
    }
    .slide.on .mini {
      border-color: #00327d;
      background: #fff;
      box-shadow: 0 4px 12px rgba(0, 50, 125, 0.15);
    }
    .slide.off .mini {
      opacity: 0.5;
    }
    .mini-q {
      font-size: 11px;
      font-weight: 700;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .mini-a {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px;
    }
    .mini-a i {
      height: 6px;
      border-radius: 2px;
      background: #c9d4e4;
    }
    .mini-a i.ok {
      background: #00875e;
    }
    .add {
      margin: 10px;
      padding: 12px;
      border: 2px dashed #b9c6d9;
      border-radius: 8px;
      text-align: center;
      font-weight: 700;
    }

    .canvas {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px 56px;
      background:
        radial-gradient(rgba(0, 50, 125, 0.08) 1.2px, transparent 1.4px) 0 0/22px
          22px,
        #f7f7f4;
    }
    .meta {
      display: flex;
      gap: 8px;
    }
    .chip {
      padding: 4px 10px;
      border-radius: 12px;
      background: #00327d;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
    }
    .chip.ghost {
      background: #fff;
      color: #00327d;
      border: 1px solid #c9d4e4;
    }
    .question {
      margin: 18px 0 32px;
      font-size: 34px;
      font-weight: 300;
      line-height: 1.2;
    }
    .caret {
      display: inline-block;
      width: 2px;
      height: 34px;
      margin-left: 2px;
      vertical-align: -6px;
      background: #00a4e0;
    }
    .answers {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .answer {
      position: relative;
      display: flex;
      align-items: center;
      height: 76px;
      overflow: hidden;
      border: 1px solid #8098be;
      border-radius: 4px;
      background: #fff;
      font-size: 18px;
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
      width: 64px;
      background: #00327d;
      color: #fff;
      font-size: 20px;
    }
    .answer.ok .letter {
      background: rgba(255, 255, 255, 0.16);
    }
    .text {
      padding: 0 18px;
    }
    .tick {
      position: absolute;
      right: 14px;
      padding: 3px 8px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      font-size: 12px;
    }
    .hint {
      margin: 22px 0 0;
      font-size: 13px;
      color: #4d70a4;
      text-align: center;
    }

    .props {
      padding: 20px;
      background: #fff;
      border-left: 1px solid #e1e7f0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .props h2 {
      margin: 6px 0 0;
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #8098be;
    }
    .field {
      display: grid;
      gap: 6px;
    }
    .field span {
      font-size: 12px;
      font-weight: 700;
      color: #4d70a4;
    }
    .field b {
      padding: 9px 12px;
      border: 1px solid #c9d4e4;
      border-radius: 6px;
      font-weight: 300;
    }
    .field b i {
      float: right;
      font-style: normal;
      color: #8098be;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #eef2f7;
    }
    .switch {
      width: 40px;
      height: 22px;
      border-radius: 11px;
      background: #c9d4e4;
      position: relative;
    }
    .switch.on {
      background: #00875e;
    }
    .switch i {
      position: absolute;
      top: 3px;
      left: 21px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
    }
    .stat {
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .ring {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: conic-gradient(#e0a100 calc(var(--v) * 1%), #eef2f7 0);
    }
    .ring b {
      display: grid;
      place-items: center;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #fff;
      font-size: 14px;
    }
    .stat-text {
      display: grid;
      gap: 2px;
      font-size: 12px;
      color: #4d70a4;
    }
    .stat-text b {
      font-size: 14px;
      color: #00327d;
    }
    .dist {
      display: grid;
      gap: 6px;
    }
    .bar {
      display: grid;
      grid-template-columns: 90px 1fr 36px;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .bar i {
      height: 8px;
      border-radius: 4px;
      background: #c9d4e4;
    }
    .bar i.ok {
      background: #00875e;
    }
    .bar em {
      font-style: normal;
      color: #4d70a4;
      text-align: right;
    }
    .actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
    }
    .actions span {
      flex: 1;
      padding: 9px;
      border: 1px solid #c9d4e4;
      border-radius: 6px;
      text-align: center;
      font-weight: 700;
    }
    .actions .danger {
      color: #d53419;
    }
    .saved {
      margin: 0;
      font-size: 12px;
      color: #00875e;
      text-align: center;
    }
  `,
})
export class StudioEditorScreen {
  protected readonly questions = QUESTIONS.slice(0, 9);
  protected readonly current = QUESTIONS[1]!;
  protected readonly letters = LETTERS;
  protected readonly live = LIVE;
  protected readonly categories = CATEGORIES;
  protected readonly distribution = [
    { l: 'Matterhorn', v: 44, ok: false },
    { l: 'Dufourspitze', v: 38, ok: true },
    { l: 'Eiger', v: 11, ok: false },
    { l: 'Jungfrau', v: 7, ok: false },
  ];
}
