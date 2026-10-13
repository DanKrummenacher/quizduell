import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { GameStateView } from '../../../core/contracts/game.contract';
import { gameState } from '../../../testing/game-state';
import { GameQuizComponent } from './game-quiz.component';

describe('GameQuizComponent', () => {
  let fixture: ComponentFixture<GameQuizComponent>;
  let element: HTMLElement;

  async function render(
    state: GameStateView,
    selectedIndex: number | null = null,
    remainingMs = 12_000,
  ) {
    fixture.componentRef.setInput('state', state);
    fixture.componentRef.setInput('selectedIndex', selectedIndex);
    fixture.componentRef.setInput('remainingMs', remainingMs);
    await fixture.whenStable();
  }

  const answers = () =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('button.answer'));
  const feedback = () =>
    element.querySelector('.feedback')?.textContent?.replace(/\s+/g, ' ').trim();

  beforeEach(() => {
    fixture = TestBed.createComponent(GameQuizComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  it('shows the question with four selectable answers', async () => {
    await render(gameState());
    expect(element.querySelector('h1')?.textContent).toContain('Wie viele Kantone');
    expect(answers().map((a) => a.className)).toEqual(
      Array(4).fill('answer state-idle'),
    );
    expect(element.textContent).toContain('Frage 1 von 7');
    expect(element.textContent).toContain('12 s');
  });

  it('emits the chosen answer once', async () => {
    const emitted: number[] = [];
    fixture.componentInstance.answer.subscribe((index) => emitted.push(index));
    await render(gameState());
    answers()[2]!.click();
    expect(emitted).toEqual([2]);

    await render(gameState(), 2);
    answers()[1]!.click();
    expect(emitted).toEqual([2]);
    expect(answers()[2]!.classList).toContain('state-selected');
    expect(feedback()).toBe('Warte auf Ben …');
  });

  it('marks the timer as urgent in the last five seconds', async () => {
    await render(gameState(), null, 4_000);
    expect(element.querySelector('.time')?.classList).toContain('urgent');
  });

  it('reveals the correct answer and the points', async () => {
    await render(
      gameState({
        phase: 'reveal',
        you: {
          name: 'Anna',
          score: 180,
          connected: true,
          hasAnswered: false,
          rematchRequested: false,
        },
        reveal: {
          correctIndex: 2,
          yourAnswerIndex: 2,
          opponentAnswerIndex: 0,
          yourPoints: 180,
          opponentPoints: 0,
        },
      }),
    );
    expect(answers()[2]!.classList).toContain('state-correct');
    expect(answers()[0]!.classList).toContain('state-dimmed');
    expect(answers()[0]!.querySelector('.marker')?.textContent?.trim()).toBe('B');
    expect(feedback()).toBe('Richtig! +180 Punkte');
  });

  it('explains a wrong answer and a timeout', async () => {
    const reveal = {
      correctIndex: 2,
      yourAnswerIndex: 1,
      opponentAnswerIndex: null,
      yourPoints: 0,
      opponentPoints: 0,
    };
    await render(gameState({ phase: 'reveal', reveal }));
    expect(answers()[1]!.classList).toContain('state-wrong');
    expect(feedback()).toBe('Leider falsch');

    await render(
      gameState({ phase: 'reveal', reveal: { ...reveal, yourAnswerIndex: null } }),
    );
    expect(feedback()).toBe('Zeit abgelaufen');
  });

  it('tells when the opponent lost the connection', async () => {
    await render(
      gameState({
        opponent: {
          name: 'Ben',
          score: 0,
          connected: false,
          hasAnswered: false,
          rematchRequested: false,
        },
      }),
    );
    expect(element.textContent).toContain('Verbindung zu Ben unterbrochen');
  });
});
