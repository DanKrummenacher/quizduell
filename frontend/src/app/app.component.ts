import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { QuizHeaderPreviewComponent } from './core/preview/quiz-header-preview.component';
import { ConnectionBannerComponent } from './core/ui/connection-banner/connection-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConnectionBannerComponent, QuizHeaderPreviewComponent],
  template: `
    <router-outlet />
    <app-connection-banner />
    @if (quizHeaderPreview) {
      <app-quiz-header-preview />
    }
  `,
})
export class AppComponent {
  /** Temporary quiz header comparison, local development only. */
  protected readonly quizHeaderPreview = environment.quizHeaderPreview;
}
