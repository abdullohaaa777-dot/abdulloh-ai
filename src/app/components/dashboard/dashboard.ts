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
    <div class="flex h-screen overflow-hidden bg-[#030403] text-[#F7F0D0]">
      <button
        type="button"
        class="fixed left-4 top-4 z-30 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/40 bg-[#080908]/95 px-3 text-[#F5D76E] shadow-[0_0_28px_rgba(212,175,55,0.18)] transition-all hover:bg-[#12100A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 md:hidden"
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
          class="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] md:hidden"
          aria-label="Menyuni yopish"
          (click)="closeMobileSidebar()"></button>
      }

      <!-- Sidebar -->
      <aside
        id="dashboard-sidebar"
        class="fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[85vw] max-w-80 sm:w-[82vw] flex-col overflow-y-auto border-r border-[#D4AF37]/30 bg-[#070806]/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl transition-transform duration-200 ease-out md:relative md:z-10 md:h-auto md:w-64 md:max-w-none md:translate-x-0 md:overflow-hidden"
        [ngClass]="mobileSidebarOpen() ? 'translate-x-0' : '-translate-x-full'">
        <div class="mb-10 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 flex items-center justify-center shadow-[0_0_28px_rgba(212,175,55,0.22)]">
              <mat-icon class="text-[#F5D76E]">health_and_safety</mat-icon>
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-black text-[#F7F0D0] leading-tight">Abdulloh AI</span>
              <span class="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.22em]">Medical System</span>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-[#C9C2A4] transition-all hover:bg-[#D4AF37]/10 hover:text-[#F5D76E] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 md:hidden"
            aria-label="Menyuni yopish"
            (click)="closeMobileSidebar()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <nav class="premium-sidebar-nav flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <a (click)="closeMobileSidebar()" routerLink="/dashboard" routerLinkActive="premium-nav-active"
             [routerLinkActiveOptions]="{exact: true}"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>dashboard</mat-icon>
            <span class="font-medium">Dashboard</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/digital-twin" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>person_pin</mat-icon>
            <span class="font-medium">Digital Twin</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/dermatology-ai" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>health_and_safety</mat-icon>
            <span class="font-medium">Dermatologik AI</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/neuromotor" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>back_hand</mat-icon>
            <span class="font-medium">NevroMotorika</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/nafas-ovoz" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>air</mat-icon>
            <span class="font-medium">Nafas va Ovoz Tahlili</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/yurak-mikro-impuls" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>favorite</mat-icon>
            <span class="font-medium">Yurak Mikro Impuls</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/silent-disease-hunter" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>radar</mat-icon>
            <span class="font-medium">Yashirin kasalliklarni erta aniqlash</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/reabilitatsiya-nazorati" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>accessibility_new</mat-icon>
            <span class="font-medium">Reabilitatsiya nazorati</span>
          </a>
          <div class="ml-2 mr-1 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-xs text-[#C9C2A4]">
            <p class="font-bold">Silent Disease Hunter — kengaytirilgan test natijalari</p>
            <p>{{ sdhAdvancedResultCount() }} ta lokal patient natijasi saqlangan</p>
          </div>
          <section class="ml-2 mr-1 rounded-2xl border border-[#7ED957]/25 bg-[#7ED957]/10 px-3 py-3 text-xs text-[#DDFDD4] space-y-2">
            <p class="font-black uppercase tracking-wide">SILENT DISEASE HUNTER — YAKUNIY TAHLILLAR</p>
            @if (sdhLatestFinalAnalysis(); as final) {
              @if (final.finalAnalysis.emergencyWarning.active) {
                <div class="rounded-xl bg-[#FF4D4D]/10 border border-[#FF4D4D]/25 p-2 text-[#FF8A8A]">Shoshilinch ogohlantirish mavjud</div>
              }
              <div class="grid grid-cols-2 gap-2">
                <div class="rounded-xl bg-black/30 border border-[#D4AF37]/10 p-2"><span class="block text-[#7ED957]">Umumiy risk</span><strong>{{ final.finalAnalysis.overallRiskPercent }}%</strong></div>
                <div class="rounded-xl bg-black/30 border border-[#D4AF37]/10 p-2"><span class="block text-[#7ED957]">Trend</span><strong>{{ sdhTrendArrow(final.finalAnalysis.trendComparison.riskChange) }}</strong></div>
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
          <a (click)="closeMobileSidebar()" routerLink="/monitoring" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>monitor_heart</mat-icon>
            <span class="font-medium">Monitoring</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/cystic-fibrosis" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>medical_services</mat-icon>
            <span class="font-medium">Mukovitsidoz</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/adherence" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>fact_check</mat-icon>
            <span class="font-medium">Adherence</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/simulator" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>model_training</mat-icon>
            <span class="font-medium">Simulator</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/telemedicine" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>chat</mat-icon>
            <span class="font-medium">Telemeditsina</span>
          </a>
          <a (click)="closeMobileSidebar()" routerLink="/analytics" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>analytics</mat-icon>
            <span class="font-medium">Analytics</span>
          </a>
          <div class="pt-4 pb-2 px-3 text-[10px] font-bold text-medical-text-muted uppercase tracking-widest">Amallar</div>
          <a (click)="closeMobileSidebar()" routerLink="/new-case" routerLinkActive="premium-nav-active"
             class="premium-nav-link flex items-center gap-3 rounded-xl p-3 transition-all">
            <mat-icon>add_circle</mat-icon>
            <span class="font-medium">Yangi holat</span>
          </a>
        </nav>

        <div class="mt-auto border-t border-[#D4AF37]/25 pt-6">
          <div class="flex items-center gap-3 mb-4 px-2">
            <div class="w-10 h-10 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#F5D76E] font-black shadow-[0_0_20px_rgba(212,175,55,0.16)]">
              {{ (userEmail() || 'abdullohaaa.777@gmail.com').charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-xs font-bold text-[#F7F0D0] truncate">{{ (userEmail() || 'abdullohaaa.777@gmail.com').split('@')[0] }}</p>
              <p class="text-[10px] text-[#8D8876] truncate">{{ userEmail() || 'abdullohaaa.777@gmail.com' }}</p>
            </div>
          </div>
          <button (click)="logout()" class="w-full flex items-center gap-3 p-3 rounded-xl text-[#D4AF37] hover:bg-[#FF4D4D]/10 hover:text-[#FF8A8A] transition-all font-bold">
            <mat-icon>logout</mat-icon>
            Chiqish
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="premium-main min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pt-20 md:p-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host{display:block}.premium-main{position:relative;background:radial-gradient(circle at 18% 8%,rgba(212,175,55,.16),transparent 30%),radial-gradient(circle at 85% 18%,rgba(245,215,110,.08),transparent 28%),linear-gradient(135deg,#030403,#050706 48%,#070807)}.premium-main:before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 110%,rgba(212,175,55,.08),transparent 34%)}.premium-nav-link{color:#C9C2A4;border:1px solid transparent}.premium-nav-link mat-icon{color:#D4AF37}.premium-nav-link:hover{color:#F7F0D0;background:rgba(212,175,55,.10);border-color:rgba(212,175,55,.22);box-shadow:0 0 24px rgba(212,175,55,.12)}.premium-nav-active{color:#F7F0D0!important;background:linear-gradient(135deg,rgba(212,175,55,.22),rgba(10,12,10,.7))!important;border-color:rgba(212,175,55,.45)!important;box-shadow:0 0 28px rgba(212,175,55,.18)!important}.premium-nav-active mat-icon{color:#F5D76E!important}.premium-sidebar-nav::-webkit-scrollbar{width:6px}.premium-sidebar-nav::-webkit-scrollbar-thumb{background:rgba(212,175,55,.28);border-radius:999px}
  `],
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
