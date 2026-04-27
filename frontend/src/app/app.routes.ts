import { Routes } from '@angular/router';
import { WelcomeScreenComponent } from './features/start/welcome-screen.component';

export const routes: Routes = [
  { path: '', component: WelcomeScreenComponent },
  { path: '**', redirectTo: '' }
];
