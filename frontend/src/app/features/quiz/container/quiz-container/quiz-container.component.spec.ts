import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GameClient } from '../../../../core/game/game-client.service';
import {
  FakeGameClient,
  gameState,
  player,
} from '../../../../testing/fake-game-client';
import { QuizContainerComponent } from './quiz-container.component';

describe('QuizContainerComponent', () => {
  let client: FakeGameClient;
  let quiz: QuizContainerComponent;

  beforeEach(() => {
    client = new FakeGameClient();
    client.state.set(gameState());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: GameClient, useValue: client },
      ],
    });
    quiz = TestBed.createComponent(QuizContainerComponent).componentInstance;
  });

  it('shows the question with four answers A to D', () => {
    expect(quiz.questionText()).toBe('Wie viele Kantone hat die Schweiz?');
    expect(quiz.answersView().map((a) => a.letter)).toEqual(['A', 'B', 'C', 'D']);
    expect(quiz.quizPhase()).toBe('PLAYING');
    expect(quiz.feedbackText()).toBeNull();
  });

  it('submits an answer once and waits for the opponent', () => {
    quiz.handleAnswer('C');
    quiz.handleAnswer('A');
    expect(client.calls).toEqual(['answer:0:2']);
    expect(quiz.quizPhase()).toBe('WAITING');
    expect(quiz.answersView()[2]?.state).toBe('selected');
    expect(quiz.feedbackText()).toBe('Warte auf den Gegner...');
  });

  it('reveals a correct answer with points and the opponent badge', () => {
    client.state.set(
      gameState({
        phase: 'reveal',
        you: player('Anna', 180),
        reveal: {
          correctIndex: 2,
          yourAnswerIndex: 2,
          opponentAnswerIndex: 1,
          yourPoints: 180,
          opponentPoints: 0,
        },
      }),
    );
    expect(quiz.quizPhase()).toBe('REVEAL');
    expect(quiz.answersView()[2]?.state).toBe('correct');
    expect(quiz.answersView()[1]?.hasOpponent).toBe(true);
    expect(quiz.feedbackText()).toBe('Richtig! +180 Punkte');
    expect(quiz.feedbackType()).toBe('success');
  });

  it('explains wrong answers and timeouts', () => {
    const reveal = {
      correctIndex: 2,
      yourAnswerIndex: 0,
      opponentAnswerIndex: null,
      yourPoints: 0,
      opponentPoints: 0,
    };
    client.state.set(gameState({ phase: 'reveal', reveal }));
    expect(quiz.answersView()[0]?.state).toBe('wrong');
    expect(quiz.feedbackText()).toBe('Falsch! +0 Punkte');

    client.state.set(
      gameState({ phase: 'reveal', reveal: { ...reveal, yourAnswerIndex: null } }),
    );
    expect(quiz.feedbackText()).toBe('Zeit abgelaufen! +0 Punkte');
  });

  it('shows the opponent-left flyout when the game was aborted', () => {
    client.state.set(gameState({ phase: 'aborted', endReason: 'opponent-left' }));
    expect(quiz.opponentLeft()).toBe(true);
  });
});
