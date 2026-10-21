import {
  Component,
  computed,
  inject,
  isDevMode,
  type OnDestroy,
  type OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { PublicInfoService } from '../../../../core/info/public-info.service';
import { IdleResetService } from '../../../../core/platform/idle-reset.service';
import { PlayerNameStore } from '../../../../core/player/player-name.store';
import { LandingAngledComponent } from '../../components/landing/landing-angled.component';
import { LandingAnswersComponent } from '../../components/landing/landing-answers.component';
import { LandingCoverComponent } from '../../components/landing/landing-cover.component';
import { LandingTvComponent } from '../../components/landing/landing-tv.component';
import { LandingArenaComponent } from '../../components/landing/landing-arena.component';
import { LandingAuroraComponent } from '../../components/landing/landing-aurora.component';
import { LandingBentoComponent } from '../../components/landing/landing-bento.component';
import { LandingKineticComponent } from '../../components/landing/landing-kinetic.component';
import { LandingProductComponent } from '../../components/landing/landing-product.component';
import { LandingRingComponent } from '../../components/landing/landing-ring.component';
import { LandingStoryComponent } from '../../components/landing/landing-story.component';
import { LandingWorldComponent } from '../../components/landing/landing-world.component';
import {
  StartFaceliftComponent,
  type StartFaceliftVariant,
} from '../../components/facelift/start-facelift.component';
import { StartDesignPanelComponent } from '../../components/next/start-design-panel.component';
import type { StartLayout } from '../../components/next/start-design';
import { StartProposalComponent } from '../../components/next/start-proposal.component';
import { StartRoundAComponent } from '../../components/next/start-round-a.component';
import { StartRoundBComponent } from '../../components/next/start-round-b.component';
import { StartRoundDComponent } from '../../components/next/start-round-d.component';
import { StartRoundEComponent } from '../../components/next/start-round-e.component';
import { StartUiComponent } from '../../components/start-ui/start-ui.component';

@Component({
  selector: 'app-start-container',
  imports: [
    StartUiComponent,
    StartFaceliftComponent,
    LandingProductComponent,
    LandingKineticComponent,
    LandingArenaComponent,
    LandingWorldComponent,
    LandingStoryComponent,
    LandingBentoComponent,
    LandingAuroraComponent,
    LandingRingComponent,
    LandingAngledComponent,
    LandingAnswersComponent,
    LandingCoverComponent,
    LandingTvComponent,
    StartRoundAComponent,
    StartRoundBComponent,
    StartProposalComponent,
    StartRoundDComponent,
    StartRoundEComponent,
    StartDesignPanelComponent,
  ],
  templateUrl: './start-container.component.html',
})
export class StartContainerComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly playerName = inject(PlayerNameStore);
  private readonly idleReset = inject(IdleResetService);
  private readonly infoService = inject(PublicInfoService);

  readonly initialName = this.playerName.name();
  readonly info = this.infoService.info;
  // TEMPORARY: start page designs under review.
  readonly showDesignPreview = isDevMode();
  readonly layout = signal<StartLayout>('today');
  readonly faceliftVariant = computed(
    () => this.layout().slice(2) as StartFaceliftVariant,
  );

  readonly featuresData = computed(() => {
    const info = this.infoService.info();
    return [
      { icon: 'survey', text: `${info.questionsPerGame} Fragen` },
      { icon: 'time-limit', text: `${info.questionDurationSec}s / Frage` },
      { icon: 'lightning-strike', text: '1 vs 1' },
    ];
  });

  readonly notice = computed(() => {
    if (!this.infoService.loaded()) {
      return null;
    }
    if (!this.infoService.reachable()) {
      return 'Der Server ist gerade nicht erreichbar. Bitte versuche es gleich nochmals.';
    }
    if (!this.infoService.info().playable) {
      return 'Das Quiz wird gerade vorbereitet. Schau gleich nochmals vorbei!';
    }
    return null;
  });

  ngOnInit(): void {
    void this.infoService.refresh();
    this.idleReset.arm();
  }

  ngOnDestroy(): void {
    this.idleReset.disarm();
  }

  handleStart(playerName: string): void {
    this.playerName.set(playerName);
    void this.router.navigate(['/lobby']);
  }
}
