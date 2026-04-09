import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="layout">
      <aside>
        <h2>Abdulloh AI</h2>
        <a routerLink="/dashboard">Dashboard</a>
        <a routerLink="/cases">Cases</a>
        <a routerLink="/urine/basic">Urine Basic</a>
        <a routerLink="/urine/strip">Urine Strip</a>
        <a routerLink="/transplant/twin">Transplant Twin</a>
        <a routerLink="/monitoring">Monitoring</a>
        @if (isAdmin()) { <a routerLink="/admin">Admin</a> }
        <button type="button" (click)="logout()">Logout</button>
      </aside>
      <main><router-outlet /></main>
    </div>
  `
})
export class ShellComponent {
  private auth = inject(AuthService);
  isAdmin = computed(() => this.auth.user()?.role === 'admin');
  logout() { this.auth.logout(); }
}
