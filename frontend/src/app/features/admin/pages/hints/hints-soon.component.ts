import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import { AdPageHeadComponent } from '../../ui/page-head.component';

/** The hints until they launch: what will come, and where to go meanwhile. */
@Component({
  selector: 'app-hints-soon',
  imports: [AdPageHeadComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './hints-soon.component.html',
  styleUrl: './hints-soon.component.scss',
})
export class HintsSoonComponent {
  /** The checks that will run on every question. */
  protected readonly checks = [
    { icon: 'bulb', title: 'Verständlichkeit' },
    { icon: 'statistic', title: 'Schwierigkeit' },
    { icon: 'time', title: 'Zeit zum Antworten' },
    { icon: 'items-list', title: 'Fragenbestand' },
  ];
}
