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
      <aside class="w-64 bg-white/95 backdrop-blur-xl border-r border-medical-border/80 p-6 flex flex-col shadow-[0_16px_35px_-30px_rgba(15,23,42,1)] z-10 relative overflow-hidden">
        <div class="absolute -top-16 -left-8 w-44 h-44 rounded-full bg-indigo-100/60 blur-2xl pointer-events-none"></div>
        <div class="absolute bottom-8 -right-8 w-36 h-36 rounded-full bg-sky-100/60 blur-2xl pointer-events-none"></div>
        <div class="flex items-center gap-3 mb-10">
          <div class="w-10 h-10 bg-gradient-to-br from-medical-primary to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-medical-primary/40">
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
          <a routerLink="/respiratory-voice" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
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
      <main class="flex-1 overflow-y-auto p-8 bg-medical-bg/40 relative">
        <div class="hud-ring w-96 h-96 -top-44 -right-20 opacity-60 pointer-events-none"></div>
        <div class="hud-ring hud-ring-slow w-72 h-72 top-1/3 -left-24 opacity-40 pointer-events-none"></div>
        <div class="floating-medical-orb w-16 h-16 right-[14%] top-24 opacity-65 pointer-events-none"></div>
        <div class="floating-medical-orb w-10 h-10 right-[26%] bottom-[18%] opacity-60 pointer-events-none" style="animation-delay: -2s"></div>
        <section class="medical-depth-card relative overflow-hidden p-5 md:p-6 mb-6">
          <div class="absolute -right-8 top-2 w-28 h-28 rounded-full bg-sky-200/45 blur-2xl pointer-events-none"></div>
          <div class="absolute -left-8 -bottom-5 w-24 h-24 rounded-full bg-indigo-200/45 blur-2xl pointer-events-none"></div>
          <p class="text-[11px] font-black uppercase tracking-[0.16em] text-medical-primary/75 mb-2">Klinik boshqaruv markazi</p>
          <h2 class="text-xl md:text-2xl font-extrabold text-medical-text tracking-tight">Bugungi klinik tahlillar shu makonda jamlanadi</h2>
          <p class="text-sm md:text-base text-medical-text-muted mt-2 max-w-3xl">Signal, vizual ma’lumot va sun’iy intellekt xulosalarini bir oqimda kuzating, talqin qiling va keyingi bosqichni aniq belgilang.</p>
        </section>
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
