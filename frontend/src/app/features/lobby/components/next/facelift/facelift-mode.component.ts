import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import type { ModeLayout } from '../lobby-design';
import { ModeBandComponent } from './mode-band.component';

@Component({
  selector: 'app-facelift-mode',
  imports: [ModeBandComponent],
  templateUrl: './facelift-mode.component.html',
  styleUrl: './facelift-mode.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FaceliftModeComponent {
  // TEMPORARY: proposals for this screen.
  readonly layout = input<ModeLayout>('facelift');
  readonly playerName = input('');
  readonly facts = input<string[]>([]);
  /** Proposal «Umschalter»: the mode chosen before starting. */
  protected readonly chosen = signal<'quick' | 'friend'>('quick');

  protected start(): void {
    if (this.chosen() === 'quick') {
      this.selectQuickGame.emit();
    } else {
      this.selectFriendGame.emit();
    }
  }

  readonly selectQuickGame = output<void>();
  readonly selectFriendGame = output<void>();
}
