import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import { joinLink } from '../../../core/game/join-intent.store';
import { QrCodeComponent } from '../../../core/ui/qr-code/qr-code.component';

/** Friend game created: shows the code and a QR code to join. */
@Component({
  selector: 'app-game-waiting',
  imports: [QrCodeComponent],
  template: `
    <p class="eyebrow">Spiel erstellt</p>
    <h1 class="title">Lade deinen Gegner ein</h1>

    <div class="invite">
      <div class="code-block">
        <p class="label" id="code-label">Spiel-Code</p>
        <p class="code" aria-labelledby="code-label">
          @for (char of chars(); track $index) {
            <span class="char">{{ char }}</span>
          }
        </p>
        <div class="actions">
          <css-button (click)="copy()">
            <css-icon slot="prefix" [icon]="copied() ? 'checkmark' : 'copy'" />
            {{ copied() ? 'Kopiert' : 'Code kopieren' }}
          </css-button>
          @if (canShare) {
            <css-button (click)="share()">
              <css-icon slot="prefix" icon="share" />
              Teilen
            </css-button>
          }
        </div>
      </div>

      <figure class="qr">
        <app-qr-code [value]="link()" label="QR-Code zum Beitreten" />
        <figcaption>Scannen und direkt beitreten</figcaption>
      </figure>
    </div>

    <p class="waiting" role="status">
      <span class="dots" aria-hidden="true"
        ><span></span><span></span><span></span
      ></span>
      Warte auf deinen Gegner …
    </p>

    <css-button variant="plain" class="cancel" (click)="dismiss.emit()"
      >Abbrechen</css-button
    >
  `,
  styleUrl: './game-waiting.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameWaitingComponent {
  readonly code = input.required<string>();
  readonly dismiss = output<void>();

  protected readonly chars = computed(() => Array.from(this.code()));
  protected readonly link = computed(() => joinLink(this.code()));
  protected readonly copied = signal(false);
  protected readonly canShare =
    typeof navigator !== 'undefined' && 'share' in navigator;

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard not available (e.g. insecure context); the code is visible anyway.
    }
  }

  protected async share(): Promise<void> {
    try {
      await navigator.share({
        title: 'playduelio',
        text: `Duell mich bei playduelio! Code: ${this.code()}`,
        url: this.link(),
      });
    } catch {
      // Share sheet dismissed.
    }
  }
}
