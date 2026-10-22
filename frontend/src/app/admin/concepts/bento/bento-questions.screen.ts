// TEMPORARY: concept 2 «Bento», the questions (development only).
import { Component } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { CATEGORIES, LETTERS, QUESTIONS } from '../mock';

@Component({
  selector: 'app-bento-questions-screen',
  imports: [ConceptBrandComponent],
  template: `
    <div class="app">
      <header class="nav">
        <app-concept-brand [size]="26" />
        <nav class="pills">
          <span>Übersicht</span><span class="on">Fragen</span><span>Regeln</span>
        </nav>
        <span class="me">A</span>
      </header>

      <main class="grid">
        <aside class="col">
          <div class="tile search"><span>⌕</span> Fragen suchen</div>
          @for (c of categories; track c.name; let i = $index) {
            <div class="tile cat" [class.on]="i === 2">
              <div>
                <b>{{ c.name }}</b
                ><span>{{ c.active }}/{{ c.total }} im Spiel</span>
              </div>
              <em>{{ c.rate }}%</em>
            </div>
          }
          <div class="tile check">
            <b>3</b> Fragen sind zu schwer <span>Ansehen →</span>
          </div>
        </aside>

        <section class="tile list">
          <div class="list-head">
            <h1>Schweiz</h1>
            <span class="new">＋ Neue Frage</span>
          </div>
          @for (q of questions; track q.id; let i = $index) {
            <div class="row" [class.on]="i === 1">
              <span class="badge" [class.low]="(q.rate ?? 100) < 40"
                >{{ q.rate }}%</span
              >
              <div class="row-text">
                <b>{{ q.text }}</b
                ><span>✓ {{ q.options[q.correct] }}</span>
              </div>
              <span class="toggle on"><i></i></span>
            </div>
          }
        </section>

        <section class="tile detail">
          <span class="label">Vorschau</span>
          <div class="phone">
            <p>{{ current.text }}</p>
            @for (o of current.options; track $index; let j = $index) {
              <div class="a" [class.ok]="j === current.correct">
                <i>{{ letters[j] }}</i
                >{{ o }}
              </div>
            }
          </div>
          <div class="facts">
            <div><b>38%</b><span>richtig</span></div>
            <div><b>37×</b><span>gestellt</span></div>
            <div><b>Aktiv</b><span>im Spiel</span></div>
          </div>
          <span class="edit">Bearbeiten</span>
        </section>
      </main>
    </div>
  `,
  styles: `
    @use 'bento' as b;
    :host {
      display: block;
      width: 1280px;
      height: 800px;
    }
    .app {
      height: 100%;
      background: b.$bg;
      color: b.$ink;
      font-size: 14px;
    }
    .nav {
      @include b.nav;
    }
    .pills {
      @include b.pills;
    }
    .me {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: b.$blue;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
    }
    .grid {
      display: grid;
      grid-template-columns: 270px 1fr 330px;
      gap: 16px;
      height: calc(100% - 74px);
      padding: 4px 32px 32px;
    }
    .tile {
      @include b.tile;
    }
    .col {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .search {
      padding: 16px 18px;
      color: b.$ink-3;
    }
    .cat {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-radius: 18px;
    }
    .cat div {
      display: grid;
    }
    .cat span {
      font-size: 12px;
      color: b.$ink-3;
    }
    .cat em {
      font-style: normal;
      font-weight: 700;
      color: b.$ink-2;
    }
    .cat.on {
      background: b.$blue;
      color: #fff;
    }
    .cat.on span,
    .cat.on em {
      color: rgba(255, 255, 255, 0.7);
    }
    .check {
      margin-top: auto;
      padding: 18px;
      background: #fff6dc;
      color: #7a5000;
    }
    .check b {
      font-size: 22px;
    }
    .check span {
      display: block;
      margin-top: 6px;
      font-weight: 700;
    }

    .list {
      display: flex;
      flex-direction: column;
      padding: 22px 8px 8px;
      overflow: hidden;
    }
    .list-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px 12px;
    }
    h1 {
      margin: 0;
      font-size: 28px;
    }
    .new {
      padding: 9px 16px;
      border-radius: 18px;
      background: b.$blue;
      color: #fff;
      font-weight: 700;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 16px;
    }
    .row.on {
      background: #f2f5fa;
    }
    .badge {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #e3f6ee;
      font-weight: 700;
      color: b.$green;
    }
    .badge.low {
      background: #fff1d6;
      color: #9a6400;
    }
    .row-text {
      flex: 1;
      display: grid;
      gap: 2px;
    }
    .row-text span {
      font-size: 13px;
      color: b.$green;
    }
    .toggle {
      position: relative;
      width: 42px;
      height: 24px;
      border-radius: 12px;
      background: b.$green;
    }
    .toggle i {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
    }

    .detail {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 22px;
    }
    .label {
      @include b.label;
    }
    .phone {
      display: grid;
      gap: 7px;
      padding: 18px 14px;
      border: 6px solid b.$blue;
      border-radius: 26px;
      background: #f7f7f4;
    }
    .phone p {
      margin: 0 0 8px;
      font-size: 16px;
      line-height: 1.3;
    }
    .a {
      display: flex;
      align-items: center;
      height: 38px;
      overflow: hidden;
      border: 1px solid #8098be;
      border-radius: 4px;
      background: #fff;
      font-size: 13px;
      font-weight: 700;
    }
    .a i {
      display: grid;
      place-items: center;
      align-self: stretch;
      width: 32px;
      margin-right: 10px;
      background: b.$blue;
      color: #fff;
      font-style: normal;
    }
    .a.ok {
      background: b.$green;
      color: #fff;
      border-color: b.$green;
    }
    .a.ok i {
      background: rgba(255, 255, 255, 0.16);
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .facts div {
      display: grid;
      padding: 10px;
      border-radius: 14px;
      background: b.$bg;
      text-align: center;
    }
    .facts b {
      font-size: 18px;
    }
    .facts span {
      font-size: 12px;
      color: b.$ink-3;
    }
    .edit {
      margin-top: auto;
      padding: 12px;
      border-radius: 16px;
      background: b.$blue;
      color: #fff;
      font-weight: 700;
      text-align: center;
    }
  `,
})
export class BentoQuestionsScreen {
  protected readonly categories = CATEGORIES;
  protected readonly questions = QUESTIONS.filter((q) => q.category === 'Schweiz');
  protected readonly current = QUESTIONS[1]!;
  protected readonly letters = LETTERS;
}
