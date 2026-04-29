import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-logo';
import '@css-ch/calc-ui-text';

@Component({
  selector: 'app-start-header',
  templateUrl: './start-header.component.html',
  styleUrl: './start-header.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StartHeaderComponent {}
