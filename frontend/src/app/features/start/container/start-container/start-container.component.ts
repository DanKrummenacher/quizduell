import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StartUiComponent } from '../../components/start-ui/start-ui.component';

@Component({
  selector: 'app-start-container',
  imports: [StartUiComponent],
  templateUrl: './start-container.component.html',
})
export class StartContainerComponent {
  private readonly router = inject(Router);

  readonly featuresData = [
    { icon: 'survey', text: '7 Fragen' },
    { icon: 'time-limit', text: '20s / Frage' },
    { icon: 'lightning-strike', text: '1 vs 1' },
  ];

  handleStart(playerName: string) {
    void this.router.navigate(['/lobby'], { state: { playerName } });
  }
}
