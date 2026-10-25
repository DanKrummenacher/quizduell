import { Component, computed } from '@angular/core';
import {
  closeFacelift,
  EDITOR_FACES,
  editorFace,
  RESET_FACES,
  resetFace,
  setResetFace,
  FACE_GROUPS,
  facelift,
  setEditorFace,
  setFacelift,
} from '../core/facelift-preview';

/** Temporary: the bar at the bottom that switches between facelift drafts. */
@Component({
  selector: 'app-ad-facelift-switcher',
  template: `
    @if (face() !== null) {
      <aside class="switcher" aria-label="Facelift vergleichen">
        @for (group of groups; track group.label) {
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
        <span class="break"></span>
        <span class="group">Fenster</span>
        @for (option of editorFaces; track option.id) {
          <button
            type="button"
            [class.is-on]="editor() === option.id"
            [attr.aria-pressed]="editor() === option.id"
            (click)="setEditor(option.id)"
          >
            {{ option.name }}
          </button>
        }
        <span class="group">Statistik zurücksetzen</span>
        @for (option of resetFaces; track option.id) {
          <button
            type="button"
            [class.is-on]="reset() === option.id"
            [attr.aria-pressed]="reset() === option.id"
            (click)="setReset(option.id)"
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

  protected readonly resetFaces = RESET_FACES;
  protected readonly reset = resetFace;

  protected setReset(face: string): void {
    setResetFace(face);
  }

  protected readonly editorFaces = EDITOR_FACES;
  protected readonly editor = editorFace;

  protected setEditor(face: string): void {
    setEditorFace(face);
  }

  protected set(face: string): void {
    setFacelift(face);
  }

  protected close(): void {
    closeFacelift();
  }
}
