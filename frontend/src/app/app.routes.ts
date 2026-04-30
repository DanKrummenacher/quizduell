import { Routes } from '@angular/router';
import { StartContainerComponent } from './features/start/container/start-container/start-container.component';
import { LobbyContainerComponent } from './features/lobby/container/lobby-container/lobby-container.component';
import { QuizContainerComponent } from './features/quiz/container/quiz-container/quiz-container.component';
import { ResultContainerComponent } from './features/result/container/result-container/result-container.component';

export const routes: Routes = [
  { path: '', component: StartContainerComponent },
  { path: 'lobby', component: LobbyContainerComponent },
  { path: 'quiz', component: QuizContainerComponent },
  { path: 'result', component: ResultContainerComponent },
  { path: '**', redirectTo: '' },
];
