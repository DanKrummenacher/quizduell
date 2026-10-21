import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import '@css-ch/components/icon';
import type { StartVisual } from './start-design';

interface WallQuestion {
  topic: string;
  text: string;
}

/** Sample questions for the wall, three columns. */
const WALL: WallQuestion[][] = [
  [
    { topic: 'Geografie', text: 'Wie viele Kantone hat die Schweiz?' },
    { topic: 'Kunst', text: 'Wer malte die Mona Lisa?' },
    { topic: 'Natur', text: 'Wie viele Beine hat eine Spinne?' },
    { topic: 'Sport', text: 'Wie lange dauert ein Fussballspiel?' },
  ],
  [
    { topic: 'Wissenschaft', text: 'Welcher Planet ist der grösste?' },
    { topic: 'Geschichte', text: 'Wann fiel die Berliner Mauer?' },
    { topic: 'Sprache', text: 'Wie viele Landessprachen hat die Schweiz?' },
    { topic: 'Chemie', text: 'Wofür steht das Zeichen O?' },
  ],
  [
    { topic: 'Geografie', text: 'Wie hoch ist das Matterhorn?' },
    { topic: 'Musik', text: 'Wie viele Saiten hat eine Gitarre?' },
    { topic: 'Technik', text: 'Wofür steht «www»?' },
    { topic: 'Natur', text: 'Welches Tier ist das schnellste?' },
  ],
];

/** TEMPORARY: the large visuals of the start page concepts. */
@Component({
  selector: 'app-start-visual',
  templateUrl: './start-visual.component.html',
  styleUrl: './start-visual.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': "'is-' + kind()", 'aria-hidden': 'true' },
})
export class StartVisualComponent {
  readonly kind = input.required<StartVisual>();
  readonly initial = input('');
  readonly questions = input(3);
  readonly seconds = input(20);

  protected readonly wall = WALL;
}
