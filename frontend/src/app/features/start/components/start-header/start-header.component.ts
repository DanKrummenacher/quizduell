import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { LogoMarkComponent } from '../../../../core/ui/logo-mark/logo-mark.component';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-start-header',
  imports: [LogoMarkComponent],
  templateUrl: './start-header.component.html',
  styleUrl: './start-header.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StartHeaderComponent {}
