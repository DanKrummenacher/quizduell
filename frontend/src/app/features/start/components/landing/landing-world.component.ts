import { Component, input, output, signal } from '@angular/core';
import { LandingNameFormComponent } from './landing-name-form.component';
import { LandingNavComponent } from './landing-nav.component';

interface Piece {
  shape: 'hexagon' | 'diamond' | 'pentagon' | 'circle';
  color: string;
  /** Position and size in % of the hero, depth 1 (far) to 3 (near). */
  x: number;
  y: number;
  size: number;
  depth: number;
  turn: number;
}

/** The eight shapes of the logo, scattered around the headline. */
const PIECES: Piece[] = [
  { shape: 'hexagon', color: '#00327d', x: 6, y: 14, size: 12, depth: 2, turn: 10 },
  { shape: 'diamond', color: '#0a4f97', x: 80, y: 8, size: 9, depth: 1, turn: -20 },
  {
    shape: 'pentagon',
    color: '#0078bb',
    x: 88,
    y: 46,
    size: 14,
    depth: 3,
    turn: 15,
  },
  { shape: 'circle', color: '#008cc9', x: 70, y: 78, size: 8, depth: 2, turn: 0 },
  {
    shape: 'hexagon',
    color: '#0098d4',
    x: 14,
    y: 70,
    size: 10,
    depth: 3,
    turn: -12,
  },
  { shape: 'diamond', color: '#00a4e0', x: 2, y: 44, size: 6, depth: 1, turn: 30 },
  { shape: 'pentagon', color: '#0a62a8', x: 30, y: 4, size: 6, depth: 1, turn: -8 },
  { shape: 'circle', color: '#00a4e0', x: 56, y: 2, size: 5, depth: 2, turn: 0 },
];

const WALL = [
  { topic: 'Geografie', text: 'Wie viele Kantone hat die Schweiz?' },
  { topic: 'Wissenschaft', text: 'Welcher Planet ist der grösste?' },
  { topic: 'Kunst', text: 'Wer malte die Mona Lisa?' },
  { topic: 'Geschichte', text: 'Wann fiel die Berliner Mauer?' },
  { topic: 'Natur', text: 'Welches Tier ist das schnellste?' },
  { topic: 'Sprache', text: 'Wie viele Landessprachen hat die Schweiz?' },
];

/**
 * TEMPORARY (landing concepts) · L4 Markenwelt: the shapes of the logo float
 * around the headline and follow the mouse; then sample questions.
 */
@Component({
  selector: 'app-landing-world',
  imports: [LandingNavComponent, LandingNameFormComponent],
  templateUrl: './landing-world.component.html',
  styleUrl: './landing-world.component.scss',
})
export class LandingWorldComponent {
  readonly questions = input.required<number>();
  readonly seconds = input.required<number>();
  readonly initialName = input('');
  readonly notice = input<string | null>(null);
  readonly startGame = output<string>();

  protected readonly pieces = PIECES;
  protected readonly wall = WALL;
  /** Where the mouse is, from -1 to 1 on both axes. */
  protected readonly pointerX = signal(0);
  protected readonly pointerY = signal(0);

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.pointerX.set(((event.clientX - box.left) / box.width) * 2 - 1);
    this.pointerY.set(((event.clientY - box.top) / box.height) * 2 - 1);
  }
}
