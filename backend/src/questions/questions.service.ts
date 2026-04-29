import { Injectable } from '@nestjs/common';
import { SEED_QUESTIONS } from './questions.seed';
import { Question } from './questions.types';

@Injectable()
export class QuestionsService {
  getRandomQuestions(amount: number = 7): Question[] {
    const shuffled = [...SEED_QUESTIONS];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, amount);
  }
}
