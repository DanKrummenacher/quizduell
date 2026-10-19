import { Component, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@css-ch/components/icon';
import '@css-ch/components/button';

@Component({
  selector: 'app-facelift-searching',
  templateUrl: './facelift-searching.component.html',
  styleUrl: './facelift-searching.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FaceliftSearchingComponent {
  readonly cancelSearch = output<void>();
}
