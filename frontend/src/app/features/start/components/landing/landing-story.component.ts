import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';
import { LandingPhoneComponent } from './landing-phone.component';

type Screen = 'name' | 'search' | 'quiz' | 'result';

/**
 * TEMPORARY (landing concepts) · L5 Scroll-Story: the way from the name to
 * the win, step by step; on wide screens the phone stays and changes its
 * screen with the step in the middle of the window.
 */
@Component({
  selector: 'app-landing-story',
  imports: [LandingNavComponent, LandingNameFormComponent, LandingPhoneComponent],
  templateUrl: './landing-story.component.html',
  styleUrl: './landing-story.component.scss',
})
export class LandingStoryComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly name = signal('');
  protected readonly cleanName = computed(() =>
    this.name().replace(/\s+/g, ' ').trim(),
  );
  protected readonly active = signal(0);
  protected readonly steps = computed<
    { screen: Screen; title: string; text: string }[]
  >(() => [
    {
      screen: 'name',
      title: 'Namen eingeben',
      text: 'Kein Account, kein Passwort. Dein Name genügt.',
    },
    {
      screen: 'search',
      title: 'Gegner finden',
      text: 'Ein Zufallsgegner in Sekunden – oder ein Freund mit Code.',
    },
    {
      screen: 'quiz',
      title: `${this.questions()} Fragen beantworten`,
      text: `${this.seconds()} Sekunden pro Frage. Schnell und richtig zählt.`,
    },
    {
      screen: 'result',
      title: 'Duell gewinnen',
      text: 'Wer mehr Punkte holt, gewinnt. Lust auf eine Revanche?',
    },
  ]);
  protected readonly activeScreen = computed(
    () => this.steps()[this.active()]!.screen,
  );

  private readonly stepElements = viewChildren<ElementRef<HTMLElement>>('step');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // The step that crosses the middle of the window is the active one.
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.active.set(
                Number((entry.target as HTMLElement).dataset['index']),
              );
            }
          }
        },
        { rootMargin: '-45% 0px -45% 0px' },
      );
      for (const step of this.stepElements()) {
        observer.observe(step.nativeElement);
      }
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
