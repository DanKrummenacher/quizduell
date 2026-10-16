import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { LayoutAsideComponent } from './core/layout/layout-aside.component';
import { LayoutConceptStore } from './core/layout/layout-concept.store';
import { LayoutPreviewComponent } from './core/layout/layout-preview.component';
import { ConnectionBannerComponent } from './core/ui/connection-banner/connection-banner.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ConnectionBannerComponent,
    LayoutPreviewComponent,
    LayoutAsideComponent,
  ],
  template: `
    <router-outlet />
    <app-connection-banner />
    @if (layout) {
      @if (layout.concept() === 'split') {
        <app-layout-aside />
      }
      <app-layout-preview />
    }
  `,
})
export class AppComponent {
  /** Temporary layout comparison, local development only. */
  protected readonly layout = environment.layoutPreview
    ? inject(LayoutConceptStore)
    : null;
}
