import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/calc-ui-logo';
import '@css-ch/calc-ui-text';
import '@css-ch/calc-ui-icon';
import '@css-ch/calc-ui-button';
import '@css-ch/calc-ui-input-text';

@Component({
  selector: 'app-welcome-screen',
  templateUrl: './welcome-screen.component.html',
  styleUrl: './welcome-screen.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WelcomeScreenComponent { }


