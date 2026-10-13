import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import '@css-ch/calc-ui-text';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import { LogoMarkComponent } from '../../core/ui/logo-mark/logo-mark.component';
import { AdminAuthService } from '../admin-auth.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoMarkComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminShellComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly links = [
    { path: 'uebersicht', label: 'Übersicht', icon: 'statistic' },
    { path: 'fragen', label: 'Fragen', icon: 'items-list' },
    { path: 'einstellungen', label: 'Einstellungen', icon: 'settings' },
  ];

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }
}
