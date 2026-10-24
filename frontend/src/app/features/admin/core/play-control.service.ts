import { inject, Injectable, signal } from '@angular/core';
import { AdminData } from './admin-data.service';
import { ConfirmService } from './confirm.service';
import { NotifyService } from './notify.service';

/**
 * Pauses the game and lets it run again, from any page: while paused no new
 * duel starts, running duels play to the end and the start page says so.
 */
@Injectable()
export class PlayControl {
  private readonly data = inject(AdminData);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotifyService);

  /** A change is on its way to the server. */
  readonly busy = signal(false);

  async pause(): Promise<void> {
    const sure = await this.confirm.ask({
      title: 'Spiel pausieren?',
      text: 'Es starten keine neuen Duelle mehr, auch keine Revanchen. Laufende Duelle spielen zu Ende. Die Startseite zeigt, dass das Quiz pausiert ist.',
      confirm: 'Pausieren',
      danger: true,
    });
    if (sure) {
      await this.set(true, 'Spiel pausiert – es starten keine neuen Duelle');
    }
  }

  async resume(): Promise<void> {
    await this.set(false, 'Spiel freigegeben – Duelle starten wieder');
  }

  private async set(paused: boolean, done: string): Promise<void> {
    this.busy.set(true);
    try {
      await this.data.setPaused(paused);
      this.notify.success(done);
    } catch {
      this.notify.error('Das hat nicht geklappt. Bitte versuche es nochmals.');
    } finally {
      this.busy.set(false);
    }
  }
}
