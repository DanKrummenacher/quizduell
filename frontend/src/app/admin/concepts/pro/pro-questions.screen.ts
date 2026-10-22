// TEMPORARY: concept 3 «Pro», questions with a side sheet (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { CATEGORIES, LETTERS, QUESTIONS } from '../mock';

@Component({
  selector: 'app-pro-questions-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="shell">
      <aside class="side">
        <app-concept-brand [size]="22" class="brand" />
        <span class="item">◧ Übersicht</span>
        <span class="item on">☰ Fragen <em>32</em></span>
        <span class="item">⚙ Spielregeln</span>
        <span class="group">Kategorien</span>
        @for (c of categories; track c.name) {
          <span class="item"
            >▪ {{ c.name }} <em>{{ c.total }}</em></span
          >
        }
      </aside>
      <div class="main">
        <header class="top">
          <span class="search">⌕ Suchen … <kbd>⌘K</kbd></span>
        </header>
        <div class="page">
          <div class="head">
            <h1>Fragen</h1>
            <div class="actions">
              <span class="btn">Importieren</span><span class="btn">Exportieren</span
              ><span class="btn primary">＋ Frage</span>
            </div>
          </div>
          <div class="filters">
            <span class="f on">Alle 32</span><span class="f">Aktiv 31</span
            ><span class="f">Pausiert 1</span><span class="f">Zu prüfen 4</span>
            <span class="add">＋ Filter</span>
          </div>
          <div class="table">
            <div class="tr th">
              <span></span><span>Frage</span><span>Kategorie</span
              ><span>Richtig</span><span>Status</span>
            </div>
            @for (q of questions; track q.id; let i = $index) {
              <div class="tr" [class.on]="i === 1">
                <span class="cb" [class.checked]="i === 1"></span>
                <span
                  ><b>{{ q.text }}</b></span
                >
                <span>{{ q.category }}</span>
                <span [class.low]="(q.rate ?? 100) < 40">{{
                  q.rate === null ? '–' : q.rate + ' %'
                }}</span>
                <span
                  ><i class="pill" [class.off]="!q.active">{{
                    q.active ? 'Aktiv' : 'Pausiert'
                  }}</i></span
                >
              </div>
            }
          </div>
        </div>
      </div>

      <aside class="sheet">
        <div class="s-head"><span>Frage #2</span><span class="x">✕</span></div>
        <h2>Welches ist der höchste Berg der Schweiz?</h2>
        <span class="pill">Aktiv</span>
        <div class="section">
          <span class="s-label">Antworten</span>
          @for (o of current.options; track $index; let j = $index) {
            <div class="opt" [class.ok]="j === current.correct">
              <i>{{ letters[j] }}</i
              >{{ o }}
              @if (j === current.correct) {
                <em>Richtig</em>
              }
            </div>
          }
        </div>
        <div class="section grid2">
          <div><span class="s-label">Kategorie</span><b>Schweiz</b></div>
          <div><span class="s-label">Erstellt</span><b>12. Okt.</b></div>
          <div><span class="s-label">Richtig</span><b class="amber">38 %</b></div>
          <div><span class="s-label">Gestellt</span><b>37×</b></div>
        </div>
        <div class="section">
          <span class="s-label">Verlauf</span>
          <p class="log">Heute 09:42 · Antwort B als richtig markiert</p>
          <p class="log">12. Okt. · Erstellt</p>
        </div>
        <div class="s-foot">
          <span class="btn">Pausieren</span
          ><span class="btn primary">Bearbeiten</span>
        </div>
      </aside>
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
      grid-template-columns: 232px 1fr 380px;
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
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 {
      margin: 0;
      font-size: 24px;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      @include p.button;
    }
    .btn.primary {
      @include p.button(true);
    }
    .filters {
      display: flex;
      gap: 6px;
    }
    .f {
      padding: 5px 10px;
      border: 1px solid p.$line;
      border-radius: 14px;
      color: p.$ink-2;
    }
    .f.on {
      border-color: p.$accent;
      background: p.$accent-soft;
      color: p.$accent;
      font-weight: 700;
    }
    .add {
      padding: 5px 10px;
      border: 1px dashed p.$line;
      border-radius: 14px;
      color: p.$ink-3;
    }
    .table {
      border: 1px solid p.$line;
      border-radius: 10px;
      overflow: hidden;
    }
    .tr {
      display: grid;
      grid-template-columns: 32px 1fr 120px 70px 80px;
      align-items: center;
      gap: 8px;
      padding: 11px 14px;
      border-top: 1px solid p.$line;
    }
    .tr.on {
      background: p.$accent-soft;
      box-shadow: inset 2px 0 0 p.$accent;
    }
    .th {
      border-top: 0;
      background: p.$side;
      font-size: 11px;
      font-weight: 700;
      color: p.$ink-3;
      text-transform: uppercase;
    }
    .cb {
      width: 14px;
      height: 14px;
      border: 1px solid #c3cbd8;
      border-radius: 3px;
    }
    .cb.checked {
      border-color: p.$accent;
      background: p.$accent;
    }
    .low {
      color: p.$red;
      font-weight: 700;
    }
    .pill {
      padding: 2px 8px;
      border-radius: 10px;
      background: p.$green-soft;
      color: p.$green;
      font-style: normal;
      font-size: 11px;
      font-weight: 700;
    }
    .pill.off {
      background: #eef0f3;
      color: p.$ink-2;
    }

    .sheet {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 18px 22px;
      border-left: 1px solid p.$line;
      box-shadow: -12px 0 32px rgba(11, 31, 68, 0.06);
    }
    .s-head {
      display: flex;
      justify-content: space-between;
      color: p.$ink-3;
    }
    h2 {
      margin: 0;
      font-size: 19px;
      line-height: 1.3;
    }
    .sheet > .pill {
      align-self: flex-start;
    }
    .section {
      display: grid;
      gap: 6px;
      padding-top: 14px;
      border-top: 1px solid p.$line;
    }
    .s-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: p.$ink-3;
    }
    .opt {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border: 1px solid p.$line;
      border-radius: 6px;
    }
    .opt i {
      display: grid;
      place-items: center;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      background: #eef0f3;
      font-style: normal;
      font-size: 11px;
      font-weight: 700;
    }
    .opt.ok {
      border-color: #a8dcc4;
      background: p.$green-soft;
      font-weight: 700;
    }
    .opt.ok i {
      background: p.$green;
      color: #fff;
    }
    .opt em {
      margin-left: auto;
      font-style: normal;
      font-size: 11px;
      color: p.$green;
    }
    .grid2 {
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .grid2 div {
      display: grid;
      gap: 2px;
    }
    .amber {
      color: #95600a;
    }
    .log {
      margin: 0;
      color: p.$ink-2;
    }
    .s-foot {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: auto;
    }
  `,
})
export class ProQuestionsScreen {
  protected readonly categories = CATEGORIES;
  protected readonly questions = QUESTIONS.slice(0, 11);
  protected readonly current = QUESTIONS[1]!;
  protected readonly letters = LETTERS;
}
