import { Module } from '@nestjs/common';
import { QuestionsModule } from './questions/questions.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [QuestionsModule, GameModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
