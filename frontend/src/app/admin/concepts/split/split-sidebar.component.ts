// TEMPORARY: the shared sidebar of concept 6 «Split-View» (development only).
import { Component, input } from '@angular/core';
import { ConceptBrandComponent } from '../brand.component';
import { CATEGORIES, LIVE } from '../mock';

@Component({
  selector: 'app-split-sidebar',
  imports: [ConceptBrandComponent],
  template: `
    <app-concept-brand [size]="22" class="brand" />
    <div class="search">⌕ Suchen</div>
    <div class="status">
      <span class="badge live">●</span>
      <div>
        <b>Spiel läuft</b
        ><span>{{ live.devices }} Geräte · {{ live.duels }} Duelle</span>
      </div>
    </div>
    <div class="group">
      <span class="cell" [class.on]="active() === 'heute'"
        ><span class="badge b1">▦</span>Heute<em>{{ live.today }}</em></span
      >
      <span class="cell" [class.on]="active() === 'regeln'"
        ><span class="badge b2">⚙</span>Spielregeln</span
      >
    </div>
    <div class="group">
      <span class="cell" [class.on]="active() === 'alle'"
        ><span class="badge b3">☰</span>Alle Fragen<em>32</em></span
      >
      @for (c of categories; track c.name) {
        <span class="cell" [class.on]="active() === c.name"
          ><span class="badge b4">{{ c.name[0] }}</span
          >{{ c.name }}<em>{{ c.total }}</em></span
        >
      }
    </div>
    <div class="group">
      <span class="cell"><span class="badge b5">⇅</span>Import &amp; Export</span>
    </div>
  `,
  styles: `
    @use 'split' as s;
    :host {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 22px 16px;
      border-right: 1px solid s.$line;
      background: s.$bg;
      color: s.$ink;
      font-size: 15px;
    }
    .brand {
      margin: 0 6px;
    }
    .search {
      padding: 8px 12px;
      border-radius: 10px;
      background: #e3e8f0;
      color: s.$ink-3;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      background: s.$group;
    }
    .status div {
      display: grid;
      gap: 2px;
    }
    .status span:not(.badge) {
      font-size: 13px;
      color: s.$ink-2;
    }
    .group {
      @include s.group;
    }
    .cell {
      @include s.cell;
      min-height: 44px;
    }
    .cell em {
      margin-left: auto;
      font-style: normal;
      color: s.$ink-3;
    }
    .cell.on {
      background: s.$blue;
      color: #fff;
    }
    .cell.on em {
      color: rgba(255, 255, 255, 0.8);
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
    .b3 {
      background: s.$ink;
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
export class SplitSidebarComponent {
  readonly active = input('regeln');
  protected readonly live = LIVE;
  protected readonly categories = CATEGORIES;
}
