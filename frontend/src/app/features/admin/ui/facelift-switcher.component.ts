import { Component, computed } from '@angular/core';
import {
  closeFacelift,
  FACE_GROUPS,
  facelift,
  setFacelift,
} from '../core/facelift-preview';
import {
  NOTICE_PREVIEWS,
  LAYOUTS,
  layoutView,
  noticePreview,
  DUEL_VIEWS,
  duelView,
  LIVE_DATA,
  liveData,
  setDuelView,
  setLiveData,
  setWaitView,
  WAIT_VIEWS,
  waitView,
  type DuelView,
  type LiveData,
  type WaitView,
} from '../core/live-demo';

/** A draft store, read and set with plain ids. */
function loose<T extends string>(store: {
  value: () => T;
  set: (id: T) => void;
}): { value: () => string; set: (id: string) => void } {
  return { value: store.value, set: (id) => store.set(id as T) };
}

/** Temporary: the bar at the bottom that switches between facelift drafts. */
@Component({
  selector: 'app-ad-facelift-switcher',
  template: `
    @if (face() !== null) {
      <aside class="switcher" aria-label="Facelift vergleichen">
        @for (group of groups; track group.label) {
          @if (group.label) {
            <span class="group">{{ group.label }}</span>
          }
          @for (option of group.faces; track option.id) {
            <button
              type="button"
              [class.is-on]="face() === option.id"
              [attr.aria-pressed]="face() === option.id"
              (click)="set(option.id)"
            >
              {{ option.name }}
            </button>
          }
        }
        <span class="break"></span>
        <span class="group">Duelle</span>
        @for (option of duelViews; track option.id) {
          <button
            type="button"
            [class.is-on]="face() === 'l8' && duels() === option.id"
            [attr.aria-pressed]="face() === 'l8' && duels() === option.id"
            (click)="setDuels(option.id)"
          >
            {{ option.name }}
          </button>
        }
        <span class="group">Warten</span>
        @for (option of waitViews; track option.id) {
          <button
            type="button"
            [class.is-on]="wait() === option.id"
            [attr.aria-pressed]="wait() === option.id"
            (click)="setWait(option.id)"
          >
            {{ option.name }}
          </button>
        }
        <span class="break"></span>
        @for (part of parts; track part.label) {
          <span class="group">{{ part.label }}</span>
          @for (option of part.options; track option.id) {
            <button
              type="button"
              [class.is-on]="part.store.value() === option.id"
              [attr.aria-pressed]="part.store.value() === option.id"
              (click)="part.store.set(option.id)"
            >
              {{ option.name }}
            </button>
          }
        }
        <span class="group">Daten</span>
        @for (option of dataOptions; track option.id) {
          <button
            type="button"
            [class.is-on]="data() === option.id"
            [attr.aria-pressed]="data() === option.id"
            (click)="setData(option.id)"
          >
            {{ option.name }}
          </button>
        }
        <button
          type="button"
          class="close"
          aria-label="Schliessen"
          (click)="close()"
        >
          ×
        </button>
      </aside>
    }
  `,
  styles: `
    .switcher {
      position: fixed;
      bottom: 16px;
      left: 50%;
      z-index: 100;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: max-content;
      max-width: calc(100vw - 32px);
      padding: 6px;
      overflow-x: auto;
      border-radius: 12px;
      background: #0b1a33;
      box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.5);
      transform: translateX(-50%);
      font-family: 'Museo Sans', helvetica, arial, sans-serif;
    }

    .break {
      flex-basis: 100%;
      height: 2px;
    }

    .group {
      margin: 0 6px 0 10px;
      color: #7fd3f7;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    button {
      height: 28px;
      padding: 0 10px;
      border: 0;
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      font: inherit;
      font-size: 12px;
      white-space: nowrap;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.16);
      }

      &.is-on {
        background: #fff;
        color: #0b1a33;
        font-weight: 700;
      }
    }

    .close {
      width: 28px;
      margin-left: 6px;
      padding: 0;
      font-size: 16px;
    }
  `,
})
export class AdFaceliftSwitcherComponent {
  protected readonly groups = FACE_GROUPS;
  protected readonly face = computed(() => facelift());

  protected readonly parts: {
    label: string;
    options: readonly { id: string; name: string }[];
    store: { value: () => string; set: (id: string) => void };
  }[] = [
    { label: 'Anordnung', options: LAYOUTS, store: loose(layoutView) },
    { label: 'Vorschau', options: NOTICE_PREVIEWS, store: loose(noticePreview) },
  ];
  protected readonly duelViews = DUEL_VIEWS;
  protected readonly waitViews = WAIT_VIEWS;
  protected readonly duels = duelView;
  protected readonly wait = waitView;

  protected setDuels(view: DuelView): void {
    setDuelView(view);
    setFacelift('l8');
  }

  protected setWait(view: WaitView): void {
    setWaitView(view);
  }

  protected readonly dataOptions = LIVE_DATA;
  protected readonly data = liveData;

  protected setData(data: LiveData): void {
    setLiveData(data);
  }

  protected set(face: string): void {
    setFacelift(face);
  }

  protected close(): void {
    closeFacelift();
  }
}
