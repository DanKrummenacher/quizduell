import { Component, computed, input } from '@angular/core';
import { encode } from 'uqr';

/** Renders a QR code as inline SVG (no external services, no innerHTML). */
@Component({
  selector: 'app-qr-code',
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + matrix().size + ' ' + matrix().size"
      shape-rendering="crispEdges"
      role="img"
      [attr.aria-label]="label()"
    >
      <rect [attr.width]="matrix().size" [attr.height]="matrix().size" fill="#fff" />
      <path [attr.d]="matrix().path" fill="#00327d" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      aspect-ratio: 1;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class QrCodeComponent {
  readonly value = input.required<string>();
  readonly label = input('QR-Code');

  protected readonly matrix = computed(() => {
    const qr = encode(this.value(), { ecc: 'M', border: 2 });
    let path = '';
    qr.data.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) {
          path += `M${x} ${y}h1v1h-1z`;
        }
      });
    });
    return { size: qr.size, path };
  });
}
