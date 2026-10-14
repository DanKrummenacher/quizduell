import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { ConnectionBannerComponent } from './core/ui/connection-banner/connection-banner.component';
import { DesignSwitcherComponent } from './core/ui/design-switcher/design-switcher.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConnectionBannerComponent, DesignSwitcherComponent],
  template: `
    <router-outlet />
    <app-connection-banner />
    @if (showDesignSwitcher) {
      <app-design-switcher />
    }
  `,
})
export class AppComponent {
  protected readonly showDesignSwitcher = environment.designPreview;
}
