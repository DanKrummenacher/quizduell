import { Component } from '@angular/core';
import { BrandHeaderComponent } from '../../../../core/ui/brand-header/brand-header.component';

@Component({
  selector: 'app-start-header',
  imports: [BrandHeaderComponent],
  template: '<app-brand-header subtitle="Quizduell Challenge" />',
})
export class StartHeaderComponent {}
