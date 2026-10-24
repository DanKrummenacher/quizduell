import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../core/confirm.service';

/** The modal question of `ConfirmService`, as a native dialog. */
@Component({
  selector: 'app-ad-confirm-dialog',
  template: `
    <dialog
      #dialog
      class="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-text"
      tabindex="-1"
      (cancel)="$event.preventDefault(); confirm.answer(false)"
      (keydown.escape)="confirm.answer(false)"
      (click)="onBackdrop($event)"
    >
      @if (confirm.request(); as request) {
        <h2 id="confirm-title">{{ request.title }}</h2>
        <p id="confirm-text">{{ request.text }}</p>
        <div class="actions">
          <button
            type="button"
            class="btn-secondary"
            (click)="confirm.answer(false)"
          >
            Abbrechen
          </button>
          <button
            type="button"
            [class]="request.danger ? 'btn-danger' : 'btn-primary'"
            (click)="confirm.answer(true)"
          >
            {{ request.confirm }}
          </button>
        </div>
      }
    </dialog>
  `,
  styleUrl: './confirm-dialog.component.scss',
})
export class AdConfirmDialogComponent {
  protected readonly confirm = inject(ConfirmService);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog().nativeElement;
      if (this.confirm.request()) {
        if (!element.open) {
          element.showModal();
        }
      } else if (element.open) {
        element.close();
      }
    });
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.confirm.answer(false);
    }
  }
}
