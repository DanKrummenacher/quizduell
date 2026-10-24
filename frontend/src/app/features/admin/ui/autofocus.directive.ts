import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

/** Moves the focus to the element once it is shown (drawers, dialogs). */
@Directive({ selector: '[appAutofocus]' })
export class AutofocusDirective {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => element.focus({ preventScroll: true }));
  }
}
