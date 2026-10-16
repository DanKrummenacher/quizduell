import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { DesignPreviewComponent } from './core/preview/design-preview.component';
import { ConnectionBannerComponent } from './core/ui/connection-banner/connection-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConnectionBannerComponent, DesignPreviewComponent],
  template: `
    <router-outlet />
    <app-connection-banner />
    @if (designPreview) {
      <app-design-preview />
    }
  `,
})
export class AppComponent {
  /** Temporary design comparison, local development only. */
  protected readonly designPreview = environment.designPreview;
}
