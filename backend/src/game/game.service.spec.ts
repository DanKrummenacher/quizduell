import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { QuestionsService } from '../questions/questions.service';
import { Player } from './game.types';

describe('GameService', () => {
  let service: GameService;

  const mockQuestionsService = {
    getRandomQuestions: jest.fn().mockReturnValue([
      {
        id: '1',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 0,
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: QuestionsService,
          useValue: mockQuestionsService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateGameCode', () => {
    it('should generate a 4-character uppercase alphanumeric code', () => {
      const code = (service as any).generateGameCode();
      expect(code.length).toBe(4);
      expect(/^[A-Z0-9]{4}$/.test(code)).toBeTruthy();
    });
  });

  describe('addPointsToPlayer (Scoring Logic)', () => {
    it('should add exactly 100 points if time taken is maximum (0 seconds left)', () => {
      const player: Player = {
        socketId: 'p1',
        name: 'Dan',
        score: 0,
        answerTimeMs: 20000,
      };
      const maxTimeMs = 20000;

      (service as any).addPointsToPlayer(player, maxTimeMs);

      expect(player.score).toBe(100);
    });

    it('should add exactly 200 points if time taken is 0 (20 seconds left)', () => {
      const player: Player = {
        socketId: 'p1',
        name: 'Dan',
        score: 0,
        answerTimeMs: 0,
      };
      const maxTimeMs = 20000;

      (service as any).addPointsToPlayer(player, maxTimeMs);

      expect(player.score).toBe(200);
    });

    it('should add proportional bonus points based on time', () => {
      const player: Player = {
        socketId: 'p1',
        name: 'Dan',
        score: 0,
        answerTimeMs: 10000,
      };
      const maxTimeMs = 20000;

      (service as any).addPointsToPlayer(player, maxTimeMs);

      expect(player.score).toBe(150);
    });
  });
});
