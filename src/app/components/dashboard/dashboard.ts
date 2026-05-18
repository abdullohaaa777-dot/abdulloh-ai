import { ChangeDetectionStrategy, Component, HostListener, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

interface SdhDashboardFinalAnalysis {
  id: string;
  patientId: string | null;
  guestSession: boolean;
  createdAt: string;
  finalAnalysis: {
    overallRiskPercent: number;
    testScores: Record<string, number>;
    trendComparison: { riskChange: string; summary: string };
    emergencyWarning: { active: boolean; message: string };
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="flex h-screen bg-medical-bg overflow-hidden">
      <button
        type="button"
        class="fixed left-4 top-4 z-30 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-medical-border bg-white px-3 text-medical-text shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-medical-primary/40 md:hidden"
        aria-label="Menyuni ochish"
        [attr.aria-expanded]="mobileSidebarOpen()"
        aria-controls="dashboard-sidebar"
        (click)="openMobileSidebar()">
        <mat-icon>menu</mat-icon>
        <span class="sr-only">Menu</span>
      </button>

      @if (mobileSidebarOpen()) {
        <button
          type="button"
          class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] md:hidden"
          aria-label="Menyuni yopish"
          (click)="closeMobileSidebar()"></button>
      }

      <!-- Sidebar -->
      <aside
        id="dashboard-sidebar"
        class="fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[85vw] max-w-80 sm:w-[82vw] flex-col overflow-y-auto border-r border-medical-border bg-white p-6 shadow-2xl shadow-slate-900/20 transition-transform duration-200 ease-out md:relative md:z-10 md:h-auto md:w-64 md:max-w-none md:translate-x-0 md:overflow-hidden md:shadow-sm"
        [ngClass]="mobileSidebarOpen() ? 'translate-x-0' : '-translate-x-full'">
        <div class="mb-10 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-medical-primary rounded-xl flex items-center justify-center shadow-lg shadow-medical-primary/30">
              <mat-icon class="text-white">health_and_safety</mat-icon>
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-bold text-medical-text leading-tight">Abdulloh AI</span>
              <span class="text-[10px] text-medical-primary font-semibold uppercase tracking-wider">Medical System</span>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-medical-text-muted transition-all hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-primary/40 md:hidden"
            aria-label="Menyuni yopish"
            (click)="closeMobileSidebar()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <nav class="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <a (click)="closeMobileSidebar()" routerLink="/dashboard" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>dashboard</mat-icon>
            <span class="font-medium">Dashboard</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/digital-twin" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>person_pin</mat-icon>
            <span class="font-medium">Digital Twin</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/dermatology-ai" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>health_and_safety</mat-icon>
            <span class="font-medium">Dermatologik AI</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/neuromotor" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>back_hand</mat-icon>
            <span class="font-medium">NevroMotorika</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/nafas-ovoz" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>air</mat-icon>
            <span class="font-medium">Nafas va Ovoz Tahlili</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/yurak-mikro-impuls" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>favorite</mat-icon>
            <span class="font-medium">Yurak Mikro Impuls</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/silent-disease-hunter" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>radar</mat-icon>
            <span class="font-medium">Yashirin kasalliklarni erta aniqlash</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/reabilitatsiya-nazorati" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>accessibility_new</mat-icon>
            <span class="font-medium">Reabilitatsiya nazorati</span>
          </a>
          <div class="ml-2 mr-1 rounded-2xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
            <p class="font-bold">Silent Disease Hunter — kengaytirilgan test natijalari</p>
            <p>{{ sdhAdvancedResultCount() }} ta lokal patient natijasi saqlangan</p>
          </div>
          <section class="ml-2 mr-1 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-xs text-emerald-900 space-y-2">
            <p class="font-black uppercase tracking-wide">SILENT DISEASE HUNTER — YAKUNIY TAHLILLAR</p>
            @if (sdhLatestFinalAnalysis(); as final) {
              @if (final.finalAnalysis.emergencyWarning.active) {
                <div class="rounded-xl bg-red-50 border border-red-100 p-2 text-red-700">Shoshilinch ogohlantirish mavjud</div>
              }
              <div class="grid grid-cols-2 gap-2">
                <div class="rounded-xl bg-white/80 p-2"><span class="block text-emerald-700">Umumiy risk</span><strong>{{ final.finalAnalysis.overallRiskPercent }}%</strong></div>
                <div class="rounded-xl bg-white/80 p-2"><span class="block text-emerald-700">Trend</span><strong>{{ sdhTrendArrow(final.finalAnalysis.trendComparison.riskChange) }}</strong></div>
              </div>
              <p>{{ final.guestSession ? 'Mehmon sessiyasi' : 'Patient profiliga bog‘langan' }}</p>
              <p class="line-clamp-2">{{ final.finalAnalysis.trendComparison.summary }}</p>
              <div class="flex gap-2">
                <a (click)="closeMobileSidebar()" routerLink="/silent-disease-hunter" class="underline font-bold">Resultni ochish</a>
                @if (final.guestSession) { <a (click)="closeMobileSidebar()" routerLink="/silent-disease-hunter" class="underline font-bold">Bemor profiliga bog‘lash</a> }
              </div>
              <p>{{ sdhFinalAnalysisCount() }} ta yakuniy tahlil tarixi</p>
            } @else {
              <p>Oldingi natija yo‘q. Test yakunlangach trend shu yerda chiqadi.</p>
            }
          </section>
          <a (click)="closeMobileSidebar()" routerLink="/monitoring" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>monitor_heart</mat-icon>
            <span class="font-medium">Monitoring</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/cystic-fibrosis" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>medical_services</mat-icon>
            <span class="font-medium">Mukovitsidoz</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/adherence" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>fact_check</mat-icon>
            <span class="font-medium">Adherence</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/simulator" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>model_training</mat-icon>
            <span class="font-medium">Simulator</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/telemedicine" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>chat</mat-icon>
            <span class="font-medium">Telemeditsina</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/analytics" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
             class="flex items-center gap-3 p-3 rounded-xl text-medical-text-muted hover:bg-slate-50 transition-all">
            <mat-icon>analytics</mat-icon>
            <span class="font-medium">Analytics</span>
          </a>
          <div class="pt-4 pb-2 px-3 text-[10px] font-bold text-medical-text-muted uppercase tracking-widest">Amallar</div>
          <a (click)="closeMobileSidebar()" routerLink="/new-case" routerLinkActive="bg-medical-primary text-white shadow-md shadow-medical-primary/20"
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
      <main class="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-medical-bg/50 p-4 pt-20 md:p-8">
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
  sdhAdvancedResultCount = signal(0);
  sdhFinalAnalysisCount = signal(0);
  sdhLatestFinalAnalysis = signal<SdhDashboardFinalAnalysis | null>(null);
  mobileSidebarOpen = signal(false);

  constructor() {
    effect(() => {
      if (typeof document === 'undefined') return;
      document.body.style.overflow = this.mobileSidebarOpen() ? 'hidden' : '';
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.closeMobileSidebar();
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      this.closeMobileSidebar();
    }
  }

  ngOnInit() {
    this.userEmail.set(this.supabase.user()?.email);
    this.sdhLoadAdvancedResultCount();
  }

  private sdhLoadAdvancedResultCount() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('abdullohAI_sdhAdvancedTestResults');
      const parsed = raw ? JSON.parse(raw) : [];
      this.sdhAdvancedResultCount.set(Array.isArray(parsed) ? parsed.length : 0);
      const finalRaw = localStorage.getItem('abdullohAI_sdhAdvancedFinalAnalyses');
      const finalParsed = finalRaw ? JSON.parse(finalRaw) : [];
      const finalList = Array.isArray(finalParsed) ? finalParsed as SdhDashboardFinalAnalysis[] : [];
      this.sdhFinalAnalysisCount.set(finalList.length);
      this.sdhLatestFinalAnalysis.set(finalList[0] ?? null);
    } catch {
      this.sdhAdvancedResultCount.set(0);
      this.sdhFinalAnalysisCount.set(0);
      this.sdhLatestFinalAnalysis.set(null);
    }
  }

  openMobileSidebar() {
    this.mobileSidebarOpen.set(true);
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }

  sdhTrendArrow(change: string): string {
    if (change === 'increased') return '↑ yomonlashgan';
    if (change === 'decreased') return '↓ yaxshilangan';
    if (change === 'stable') return '→ stabil';
    return 'oldingi natija yo‘q';
  }

  async logout() {
    this.closeMobileSidebar();
    await this.supabase.signOut();
    this.router.navigate(['/auth']);
  }
}
