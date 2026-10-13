import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandComponent } from '../brand/brand.component';

/**
 * Responsive page frame: brand header, safe-area aware padding and a centered
 * content column. On larger screens the content sits on a floating panel.
 */
@Component({
  selector: 'app-page',
  imports: [BrandComponent, RouterLink],
  template: `
    <header class="header">
      <div class="header-start"><ng-content select="[pageStart]" /></div>
      <a
        class="brand-link"
        routerLink="/"
        [attr.tabindex]="brandLink() ? 0 : -1"
        [class.inactive]="!brandLink()"
        aria-label="playduelio Startseite"
      >
        <app-brand [compact]="compactBrand()" />
      </a>
      <div class="header-end"><ng-content select="[pageEnd]" /></div>
    </header>
    <main
      class="main"
      [class.wide]="width() === 'wide'"
      [class.game]="width() === 'game'"
      [class.center]="centered()"
      [class.center-large]="centeredOnLarge()"
    >
      <div class="panel" [class.plain]="plain()">
        <ng-content />
      </div>
    </main>
  `,
  styleUrl: './page.component.scss',
})
export class PageComponent {
  readonly width = input<'narrow' | 'game' | 'wide'>('narrow');
  /** Vertically centers the content (start screens, dialogs). */
  readonly centered = input(false);
  /** Vertically centers the content on tablets and desktops only. */
  readonly centeredOnLarge = input(false);
  /** Renders the content without the floating panel on large screens. */
  readonly plain = input(false);
  readonly compactBrand = input(false);
  readonly brandLink = input(true);
}
