import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import {
  closeFacelift,
  FACE_GROUPS,
  faceData,
  facelift,
  setFaceData,
  setFacelift,
} from '../core/facelift-preview';

/** Temporary: the bar at the bottom that switches between facelift drafts. */
@Component({
  selector: 'app-ad-facelift-switcher',
  template: `
    @if (face() !== null) {
      <aside class="switcher" aria-label="Facelift vergleichen">
        @for (group of shown(); track group.label) {
          <span class="set">
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
          </span>
        }
        <span class="set">
          <span class="group">Daten</span>
          <button
            type="button"
            [class.is-on]="data() === 'empty'"
            (click)="setData('empty')"
          >
            Ohne
          </button>
          <button
            type="button"
            [class.is-on]="data() === 'full'"
            (click)="setData('full')"
          >
            Mit
          </button>
          <button
            type="button"
            [class.is-on]="data() === 'alarm'"
            (click)="setData('alarm')"
          >
            Notfall
          </button>
        </span>
        @if (hasMore) {
          <button
            type="button"
            class="more"
            [attr.aria-expanded]="all()"
            (click)="all.set(!all())"
          >
            {{ all() ? 'Weniger' : 'Ältere Runden' }}
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

    .set {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-right: 6px;
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

    .more {
      background: none;
      color: #7fd3f7;
      text-decoration: underline;
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
  /** Only «Heute» and the newest round, unless all are asked for. */
  protected readonly all = signal(false);
  protected readonly hasMore = FACE_GROUPS.length > 2;
  protected readonly shown = computed(() =>
    this.all() ? FACE_GROUPS : FACE_GROUPS.slice(0, 2),
  );

  constructor() {
    // Bars fixed at the bottom of the page sit above the switcher.
    const root = document.documentElement;
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let observer: ResizeObserver | null = null;
    afterNextRender(() => {
      observer = new ResizeObserver(() => {
        const box = host.querySelector('.switcher');
        root.style.setProperty(
          '--switcher-h',
          box ? `${box.getBoundingClientRect().height + 16}px` : '0px',
        );
      });
      observer.observe(host);
    });
    inject(DestroyRef).onDestroy(() => {
      observer?.disconnect();
      root.style.removeProperty('--switcher-h');
    });
  }

  protected readonly face = computed(() => facelift());
  protected readonly data = faceData;

  protected setData(data: 'empty' | 'full' | 'alarm'): void {
    setFaceData(data);
  }

  protected set(face: string): void {
    setFacelift(face);
  }

  protected close(): void {
    closeFacelift();
  }
}
