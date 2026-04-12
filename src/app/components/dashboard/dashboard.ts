import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="flex h-screen bg-medical-bg overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-medical-border p-6 flex flex-col shadow-sm z-10">
        <div class="flex items-center gap-3 mb-10">
          <div class="w-10 h-10 bg-medical-primary rounded-xl flex items-center justify-center shadow-lg shadow-medical-primary/30">
            <mat-icon class="text-white">health_and_safety</mat-icon>
          </div>
          <div class="flex flex-col">
            <span class="text-lg font-bold text-medical-text leading-tight">Abdulloh AI</span>
            <span class="text-[10px] text-medical-primary font-semibold uppercase tracking-wider">Medical System</span>
          </div>
        </div>

        <nav class="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <a routerLink="/dashboard" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20" 
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>dashboard</mat-icon>
            <span class="font-medium">Dashboard</span>
          </a>
          <a routerLink="/digital-twin" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>person_pin</mat-icon>
            <span class="font-medium">Digital Twin</span>
          </a>
          <a routerLink="/dermatology-ai" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>health_and_safety</mat-icon>
            <span class="font-medium">Dermatologik AI</span>
          </a>
          <a routerLink="/neuromotor" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>back_hand</mat-icon>
            <span class="font-medium">NevroMotorika</span>
          </a>
          <a routerLink="/nafas-ovoz" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>air</mat-icon>
            <span class="font-medium">Nafas va Ovoz Tahlili</span>
          </a>
          <a routerLink="/monitoring" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>monitor_heart</mat-icon>
            <span class="font-medium">Monitoring</span>
          </a>
          <a routerLink="/cystic-fibrosis" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>medical_services</mat-icon>
            <span class="font-medium">Mukovitsidoz</span>
          </a>
          <a routerLink="/adherence" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>fact_check</mat-icon>
            <span class="font-medium">Adherence</span>
          </a>
          <a routerLink="/simulator" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>model_training</mat-icon>
            <span class="font-medium">Simulator</span>
          </a>
          <a routerLink="/telemedicine" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>chat</mat-icon>
            <span class="font-medium">Telemeditsina</span>
          </a>
          <a routerLink="/analytics" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>analytics</mat-icon>
            <span class="font-medium">Analytics</span>
          </a>
          <div class="pt-4 pb-2 px-3 text-[10px] font-bold text-medical-text-muted uppercase tracking-widest">Amallar</div>
          <a routerLink="/new-case" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>add_circle</mat-icon>
            <span class="font-medium">Yangi holat</span>
          </a>
        </nav>

        <div class="mt-auto pt-6 border-t border-medical-border">
          <div class="flex items-center gap-3 mb-4 px-2">
            <div class="w-10 h-10 rounded-full bg-slate-100 border border-medical-border flex items-center justify-center text-medical-primary font-bold">
              {{ userEmail()?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-xs font-semibold text-medical-text truncate">{{ userEmail()?.split('@')?.[0] }}</p>
              <p class="text-[10px] text-medical-text-muted truncate">{{ userEmail() }}</p>
            </div>
          </div>
          <button (click)="logout()" class="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium">
            <mat-icon>logout</mat-icon>
            Chiqish
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-8 bg-medical-bg/50">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  userEmail = signal<string | undefined>(undefined);

  ngOnInit() {
    this.userEmail.set(this.supabase.user()?.email);
  }

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/auth']);
  }
}
