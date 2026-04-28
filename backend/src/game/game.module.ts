import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [QuestionsModule],
  providers: [GameService, GameGateway],
})
export class GameModule {}
