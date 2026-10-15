import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectionBannerComponent } from './core/ui/connection-banner/connection-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConnectionBannerComponent],
  template: '<router-outlet /><app-connection-banner />',
})
export class AppComponent {}
