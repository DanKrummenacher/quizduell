import { Component } from '@angular/core';
import { LogoMarkComponent } from '../logo-mark/logo-mark.component';

/** Full-width gradient bar with app icon and wordmark, flush with the top edge. */
@Component({
  selector: 'app-brand-header',
  imports: [LogoMarkComponent],
  templateUrl: './brand-header.component.html',
  styleUrl: './brand-header.component.scss',
})
export class BrandHeaderComponent {}
