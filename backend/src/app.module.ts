import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionsModule } from './questions/questions.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [QuestionsModule, GameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
