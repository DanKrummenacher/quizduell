import {
  Component,
  DestroyRef,
  DOCUMENT,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdConfirmDialogComponent } from '../../ui/confirm-dialog.component';
import { AdNoticesComponent } from '../../ui/notices.component';

/**
 * Frame of everything under `/admin`: the shared admin styles, notices and
 * the confirm dialog. While it is shown, the document keeps a fixed 16px root
 * size (the game grows it on large screens, a working tool must not).
 */
@Component({
  selector: 'app-admin-root',
  imports: [RouterOutlet, AdNoticesComponent, AdConfirmDialogComponent],
  template: `
    <router-outlet />
    <app-ad-notices />
    <app-ad-confirm-dialog />
  `,
  styleUrl: './admin-root.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AdminRootComponent {
  constructor() {
    const root = inject(DOCUMENT).documentElement;
    const before = {
      fontSize: root.style.fontSize,
      background: root.style.background,
    };
    root.style.fontSize = '16px';
    root.style.background = '#f7f7f4';
    inject(DestroyRef).onDestroy(() => {
      root.style.fontSize = before.fontSize;
      root.style.background = before.background;
    });
  }
}
