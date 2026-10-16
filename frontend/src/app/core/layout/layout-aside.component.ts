import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/icon';
import { PublicInfoService } from '../info/public-info.service';
import { LogoMarkComponent } from '../ui/logo-mark/logo-mark.component';

/**
 * Concept E («Geteilt»): brand area with the rules on the left of large
 * screens. Shown by styles.scss only on game screens from 1200px.
 */
@Component({
  selector: 'app-layout-aside',
  imports: [LogoMarkComponent],
  template: `
    <div class="inner">
      <div class="brand">
        <app-logo-mark [inverse]="true" class="logo" />
        <span class="wordmark"><span class="light">play</span>duelio</span>
      </div>
      <p class="claim">Quizduell Challenge</p>
      <h2 class="title">So funktioniert’s</h2>

      <ol class="steps">
        <li>
          <span class="number">1</span>
          <span><strong>Namen eingeben</strong> – ohne Konto, direkt los.</span>
        </li>
        <li>
          <span class="number">2</span>
          <span
            ><strong>Gegner finden</strong> – zufällig oder Freund per Code.</span
          >
        </li>
        <li>
          <span class="number">3</span>
          <span
            ><strong>Schnell und richtig antworten</strong> – Tempo bringt bis zu 100
            Bonuspunkte.</span
          >
        </li>
      </ol>

      <div class="facts">
        <span
          ><css-icon icon="survey" size="sm"></css-icon>{{ facts().questions }}</span
        >
        <span
          ><css-icon icon="time-limit" size="sm"></css-icon>{{ facts().time }}</span
        >
        <span><css-icon icon="lightning-strike" size="sm"></css-icon>1 vs 1</span>
      </div>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0 auto 0 0;
      width: var(--layout-aside-width);
      display: none;
      color: #fff;
      background:
        radial-gradient(circle at 15% 10%, rgba(0, 164, 224, 0.35), transparent 45%),
        radial-gradient(circle at 90% 85%, rgba(0, 120, 187, 0.45), transparent 50%),
        #00327d;
      border-right: 4px solid transparent;
      border-image: linear-gradient(#00327d, #0078bb 45%, #00a4e0) 1;
    }
    .inner {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      max-width: 30rem;
      margin: 0 auto;
      padding: 3rem 2.5rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo {
      width: 2.75rem;
      height: 2.75rem;
    }
    .wordmark {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      .light {
        font-weight: 300;
      }
    }
    .claim {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.75;
    }
    .title {
      margin: 2.5rem 0 0;
      font-size: 2rem;
      font-weight: 500;
      line-height: 1.15;
      text-wrap: balance;
    }
    .steps {
      display: grid;
      gap: 1rem;
      margin: 2rem 0 0;
      padding: 0;
      list-style: none;
      font-size: 1rem;
      line-height: 1.35;

      li {
        display: flex;
        gap: 0.875rem;
        align-items: flex-start;
      }
      strong {
        font-weight: 700;
      }
    }
    .number {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 1.75rem;
      height: 1.75rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      font-weight: 700;
      font-size: 0.875rem;
    }
    .facts {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 2.5rem;

      span {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.8rem;
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
        font-size: 0.875rem;
      }
      css-icon {
        color: #fff;
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LayoutAsideComponent {
  private readonly info = inject(PublicInfoService).info;

  protected readonly facts = computed(() => ({
    questions: `${this.info().questionsPerGame} Fragen`,
    time: `${this.info().questionDurationSec}s / Frage`,
  }));
}
