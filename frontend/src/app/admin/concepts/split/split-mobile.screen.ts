// TEMPORARY: concept 6 «Split-View» on the phone (development only).
import { Component } from '@angular/core';
import { CATEGORIES, LIVE } from '../mock';

@Component({
  selector: 'app-split-mobile-screen',
  template: `
    <div class="app">
      <h1>Admin</h1>
      <div class="search">⌕ Suchen</div>
      <div class="group">
        <div class="cell status">
          <span class="badge live">●</span>
          <div>
            <b>Spiel läuft</b
            ><span>{{ live.devices }} Geräte · {{ live.duels }} Duelle</span>
          </div>
        </div>
      </div>
      <div class="group">
        <div class="cell">
          <span class="badge b1">▦</span>Heute<em>{{ live.today }} Duelle</em
          ><i>›</i>
        </div>
        <div class="cell">
          <span class="badge b2">⚙</span>Spielregeln<em>3 Fragen · 20 s</em><i>›</i>
        </div>
      </div>
      <p class="caption">Fragen</p>
      <div class="group">
        <div class="cell">
          <span class="badge b3">☰</span>Alle Fragen<em>32</em><i>›</i>
        </div>
        @for (c of categories; track c.name) {
          <div class="cell">
            <span class="badge b4">{{ c.name[0] }}</span
            >{{ c.name }}<em>{{ c.total }}</em
            ><i>›</i>
          </div>
        }
      </div>
      <div class="group">
        <div class="cell">
          <span class="badge b5">⇅</span>Import &amp; Export<i>›</i>
        </div>
      </div>
    </div>
  `,
  styles: `
    @use 'split' as s;
    :host {
      display: block;
      width: 390px;
      height: 844px;
    }
    .app {
      height: 100%;
      padding: 60px 16px 0;
      background: s.$bg;
      color: s.$ink;
      font-size: 16px;
    }
    h1 {
      margin: 0 4px 10px;
      font-size: 34px;
    }
    .search {
      margin-bottom: 20px;
      padding: 9px 12px;
      border-radius: 10px;
      background: #e3e8f0;
      color: s.$ink-3;
    }
    .caption {
      @include s.caption;
    }
    .group {
      @include s.group;
      margin-bottom: 22px;
    }
    .cell {
      @include s.cell;
    }
    .cell em {
      margin-left: auto;
      font-style: normal;
      color: s.$ink-3;
    }
    .cell i {
      margin-left: auto;
      font-style: normal;
      font-size: 20px;
      color: s.$ink-3;
    }
    .cell em + i {
      margin-left: 0;
    }
    .status {
      padding: 12px 16px;
    }
    .status div {
      display: grid;
      gap: 2px;
    }
    .status span:not(.badge) {
      font-size: 13px;
      color: s.$ink-2;
    }
    .badge {
      @include s.badge(s.$ink);
    }
    .badge.live {
      @include s.badge(s.$green);
      width: 40px;
      height: 40px;
      border-radius: 10px;
      font-size: 12px;
    }
    .b1 {
      background: #00a4e0;
    }
    .b2 {
      background: #4d70a4;
    }
    .b4 {
      background: #0078bb;
      font-weight: 700;
    }
    .b5 {
      background: s.$green;
    }
  `,
})
export class SplitMobileScreen {
  protected readonly live = LIVE;
  protected readonly categories = CATEGORIES;
}
