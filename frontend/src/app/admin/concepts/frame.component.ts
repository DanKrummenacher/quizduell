// TEMPORARY: a screen of a design concept, small and enlarged (development only).
import { NgComponentOutlet } from '@angular/common';
import { Component, computed, input, signal, type Type } from '@angular/core';

const SIZES = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

/**
 * Shows a screen at its real size, scaled down to a thumbnail. A click
 * opens it as large as the window allows.
 */
@Component({
  selector: 'app-concept-frame',
  imports: [NgComponentOutlet],
  template: `
    <figure class="figure">
      <button
        type="button"
        class="thumb"
        [style.width.px]="size().width * scale()"
        [style.height.px]="size().height * scale()"
        [attr.aria-label]="label() + ' gross ansehen'"
        (click)="open.set(true)"
      >
        <span
          class="canvas"
          [class.mobile]="kind() === 'mobile'"
          [style.width.px]="size().width"
          [style.height.px]="size().height"
          [style.transform]="'scale(' + scale() + ')'"
          inert
        >
          <ng-container *ngComponentOutlet="screen()" />
        </span>
      </button>
      <figcaption>{{ label() }}</figcaption>
    </figure>

    @if (open()) {
      <div
        class="lightbox"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="label()"
      >
        <button
          type="button"
          class="backdrop"
          tabindex="-1"
          aria-label="Schliessen"
          (click)="open.set(false)"
        ></button>
        <div class="stage">
          <div class="bar">
            <span>{{ label() }}</span>
            <button type="button" class="close" (click)="open.set(false)">
              Schliessen ✕
            </button>
          </div>
          <div
            class="big"
            [class.mobile]="kind() === 'mobile'"
            [style.width.px]="size().width * fit()"
            [style.height.px]="size().height * fit()"
          >
            <div
              class="canvas"
              [style.width.px]="size().width"
              [style.height.px]="size().height"
              [style.transform]="'scale(' + fit() + ')'"
            >
              <ng-container *ngComponentOutlet="screen()" />
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .figure {
      margin: 0;
    }

    .thumb {
      position: relative;
      display: block;
      padding: 0;
      overflow: hidden;
      border: 0;
      border-radius: 10px;
      background: #fff;
      box-shadow:
        0 1px 2px rgba(0, 25, 62, 0.08),
        0 12px 32px rgba(0, 25, 62, 0.14);
      cursor: zoom-in;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow:
          0 1px 2px rgba(0, 25, 62, 0.08),
          0 20px 44px rgba(0, 25, 62, 0.2);
      }
    }

    .canvas {
      position: absolute;
      top: 0;
      left: 0;
      display: block;
      overflow: hidden;
      transform-origin: 0 0;
      text-align: left;
    }

    figcaption {
      margin-top: 10px;
      font-size: 13px;
      color: #4d70a4;
    }

    .lightbox {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
    }

    .backdrop {
      position: absolute;
      inset: 0;
      border: 0;
      background: rgba(8, 18, 38, 0.82);
      backdrop-filter: blur(6px);
    }

    .stage {
      position: relative;
      display: grid;
      gap: 10px;
    }

    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
      font-size: 14px;
    }

    .close {
      padding: 6px 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      background: none;
      color: #fff;
      font: inherit;
      cursor: pointer;
    }

    .big {
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);

      &.mobile {
        border-radius: 36px;
      }
    }
  `,
})
export class ConceptFrameComponent {
  readonly screen = input.required<Type<unknown>>();
  readonly kind = input<'desktop' | 'mobile'>('desktop');
  readonly label = input('');
  /** Width of the thumbnail in pixels. */
  readonly width = input(560);

  protected readonly open = signal(false);
  protected readonly size = computed(() => SIZES[this.kind()]);
  /** Phones as tall as the desktop thumbnails beside them. */
  protected readonly scale = computed(() =>
    this.kind() === 'mobile'
      ? (this.width() * 800) / 1280 / 844
      : this.width() / 1280,
  );
  /** As large as the window allows, never larger than the real size. */
  protected readonly fit = computed(() => {
    const { width, height } = this.size();
    return Math.min(
      1,
      (window.innerWidth - 48) / width,
      (window.innerHeight - 90) / height,
    );
  });
}
