import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import '@css-ch/components/notification';
import { PLAYER_NAME_MAX_LENGTH } from '../../core/contracts/game.contract';
import { JoinIntentStore } from '../../core/game/join-intent.store';
import { PublicInfoService } from '../../core/info/public-info.service';
import { IdleResetService } from '../../core/platform/idle-reset.service';
import { PlayerNameStore } from '../../core/player/player-name.store';
import { PageComponent } from '../../core/ui/page/page.component';

@Component({
  selector: 'app-start-page',
  imports: [PageComponent],
  templateUrl: './start.page.html',
  styleUrl: './start.page.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StartPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly joinIntent = inject(JoinIntentStore);
  private readonly playerName = inject(PlayerNameStore);
  private readonly idleReset = inject(IdleResetService);
  protected readonly infoService = inject(PublicInfoService);

  protected readonly maxLength = PLAYER_NAME_MAX_LENGTH;
  protected readonly name = signal(this.playerName.name());
  protected readonly error = signal('');
  protected readonly invitedCode = this.joinIntent.code;

  protected readonly features = computed(() => {
    const info = this.infoService.info();
    return [
      { icon: 'survey', label: `${info.questionsPerGame} Fragen` },
      { icon: 'time-limit', label: `${info.questionDurationSec} Sek. pro Frage` },
      { icon: 'lightning-strike', label: '1 gegen 1' },
    ];
  });

  protected readonly notice = computed(() => {
    if (!this.infoService.loaded()) {
      return null;
    }
    if (!this.infoService.reachable()) {
      return 'Der Server ist gerade nicht erreichbar. Bitte versuche es in einem Moment nochmals.';
    }
    if (!this.infoService.info().playable) {
      return 'Das Spiel wird gerade vorbereitet. Schau gleich nochmals vorbei!';
    }
    return null;
  });

  ngOnInit(): void {
    this.joinIntent.setFromLink(this.route.snapshot.queryParamMap.get('code'));
    void this.infoService.refresh();
    this.idleReset.arm();
  }

  ngOnDestroy(): void {
    this.idleReset.disarm();
  }

  protected onNameChange(event: Event): void {
    const value = (event as CustomEvent<string>).detail ?? '';
    this.name.set(value);
    this.error.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submit();
    }
  }

  protected submit(): void {
    const name = this.name().replace(/\s+/g, ' ').trim();
    if (!name) {
      this.error.set('Bitte gib deinen Namen ein.');
      return;
    }
    if (name.length > PLAYER_NAME_MAX_LENGTH) {
      this.error.set(
        `Der Name darf höchstens ${PLAYER_NAME_MAX_LENGTH} Zeichen lang sein.`,
      );
      return;
    }
    this.playerName.set(name);
    void this.router.navigate(['/lobby']);
  }
}
